package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.SubmissionReviewDetailDTO;
import com.artifactcomparator.dto.reviewer.*;
import com.artifactcomparator.model.ReviewerAssignment;
import com.artifactcomparator.model.User;
import com.artifactcomparator.model.evaluation.EvaluationSubmission;
import com.artifactcomparator.model.evaluation.EvaluationTask;
import com.artifactcomparator.model.evaluation.ParticipantTaskAssignment;
import com.artifactcomparator.repository.ReviewerAssignmentRepository;
import com.artifactcomparator.repository.UserRepository;
import com.artifactcomparator.repository.evaluation.EvaluationAnnotationRepository;
import com.artifactcomparator.repository.evaluation.EvaluationSubmissionRepository;
import com.artifactcomparator.repository.evaluation.ParticipantTaskAssignmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewerEvaluationService {

    private final EvaluationSubmissionRepository submissionRepository;
    private final ParticipantTaskAssignmentRepository assignmentRepository;
    private final ReviewerAssignmentRepository reviewerAssignmentRepository;
    private final EvaluationAnnotationRepository annotationRepository;
    private final SubmissionService submissionService;
    private final UserRepository userRepository;

    @Value("${app.reviewer.fast-threshold-seconds:20}")
    private int defaultFastThresholdSeconds;

    @Transactional(readOnly = true)
    public SubmissionReviewDetailDTO getReviewerView(Long studyId, Long assignmentId, Long reviewerId) {
        ensureReviewerAssignment(studyId, reviewerId);
        ParticipantTaskAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getEvaluationTask().getStudy() == null ||
            !Objects.equals(assignment.getEvaluationTask().getStudy().getId(), studyId)) {
            throw new IllegalArgumentException("Assignment does not belong to the requested study");
        }

        if (!submissionRepository.existsByAssignmentId(assignmentId)) {
            throw new IllegalStateException("This assignment has not been submitted yet");
        }

        return submissionService.buildSubmissionDetailForReviewer(assignment);
    }

    @Transactional(readOnly = true)
    public SubmissionReviewDetailDTO getReviewerViewByAssignment(Long assignmentId, Long reviewerId) {
        ParticipantTaskAssignment assignment = resolveAccessibleAssignment(assignmentId, reviewerId);
        return submissionService.buildSubmissionDetailForReviewer(assignment);
    }

    @Transactional
    public ReviewerEvaluationDecisionResponse saveReviewerDecision(
        Long studyId,
        Long assignmentId,
        ReviewerEvaluationDecisionRequest request,
        Long reviewerId
    ) {
        ReviewerAssignment reviewerAssignment = ensureReviewerAssignment(studyId, reviewerId);

        ParticipantTaskAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getEvaluationTask().getStudy() == null ||
            !Objects.equals(assignment.getEvaluationTask().getStudy().getId(), studyId)) {
            throw new IllegalArgumentException("Assignment does not belong to the requested study");
        }

        EvaluationSubmission submission = submissionRepository.findByAssignmentId(assignmentId)
            .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        EvaluationSubmission.ReviewerStatus status = parseStatus(request.getReviewerStatus());
        submission.setReviewerStatus(status);
        submission.setReviewerNotes(request.getReviewerNotes());
        submission.setReviewerQualityScore(request.getReviewerQualityScore());
        submission.setReviewedAt(LocalDateTime.now());

        User reviewer = userRepository.findById(reviewerId)
            .orElseThrow(() -> new EntityNotFoundException("Reviewer not found"));
        submission.setReviewedBy(reviewer);

        submissionRepository.save(submission);

        if (assignment.getStatus() != ParticipantTaskAssignment.AssignmentStatus.REVIEWED) {
            assignment.setStatus(ParticipantTaskAssignment.AssignmentStatus.REVIEWED);
            assignmentRepository.save(assignment);
        }

        if (reviewerAssignment.getStatus() == ReviewerAssignment.AssignmentStatus.ACCEPTED) {
            reviewerAssignment.setStatus(ReviewerAssignment.AssignmentStatus.IN_PROGRESS);
            reviewerAssignmentRepository.save(reviewerAssignment);
        }

        return ReviewerEvaluationDecisionResponse.builder()
            .assignmentId(assignmentId)
            .submissionId(submission.getId())
            .reviewerStatus(submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : null)
            .reviewerNotes(submission.getReviewerNotes())
            .reviewerQualityScore(submission.getReviewerQualityScore())
            .reviewedAt(submission.getReviewedAt())
            .reviewedById(reviewer.getId())
            .reviewedByName(reviewer.getFullName())
            .build();
    }

    @Transactional
    public ReviewerEvaluationDecisionResponse saveReviewerDecisionByAssignment(
        Long assignmentId,
        ReviewerEvaluationDecisionRequest request,
        Long reviewerId
    ) {
        ParticipantTaskAssignment assignment = resolveAccessibleAssignment(assignmentId, reviewerId);
        Long studyId = assignment.getEvaluationTask().getStudy() != null
            ? assignment.getEvaluationTask().getStudy().getId()
            : null;
        if (studyId == null) {
            throw new IllegalArgumentException("Assignment does not belong to a study");
        }
        return saveReviewerDecision(studyId, assignmentId, request, reviewerId);
    }

    @Transactional(readOnly = true)
    public ReviewerDashboardDTO getDashboard(
        Long studyId,
        Long reviewerId,
        ReviewerDashboardFilter filter,
        Integer fastThresholdSeconds
    ) {
        ReviewerAssignment assignment = ensureReviewerAssignment(studyId, reviewerId);

        List<EvaluationSubmission> submissions = submissionRepository.findByAssignmentEvaluationTaskStudyId(studyId);

        List<ReviewerEvaluationSummaryDTO> summaries = submissions.stream()
            .map(this::mapToSummary)
            .toList();

        List<ReviewerEvaluationSummaryDTO> filtered = applyFilters(summaries, filter);

        int threshold = fastThresholdSeconds != null ? fastThresholdSeconds : defaultFastThresholdSeconds;

        List<ReviewerEvaluationSummaryDTO> suspicious = filtered.stream()
            .filter(item -> "SUSPICIOUS".equals(item.getReviewerStatus()))
            .toList();

        List<ReviewerEvaluationSummaryDTO> incomplete = filtered.stream()
            .filter(item -> "INCOMPLETE".equals(item.getReviewerStatus()))
            .toList();

        List<ReviewerEvaluationSummaryDTO> fast = filtered.stream()
            .filter(item -> item.getTimeSpentSeconds() != null && item.getTimeSpentSeconds() < threshold)
            .toList();

        Map<Integer, Long> distribution = buildQualityDistribution(filtered);

        ReviewerDashboardStatsDTO stats = buildStats(filtered, fast);
        List<ReviewerParticipantSummaryDTO> participantSummaries = buildParticipantSummaries(filtered);

        ReviewerFilterOptionsDTO filterOptions = buildFilterOptions(summaries);

        String studyTitle = assignment.getStudy() != null ? assignment.getStudy().getTitle() : null;

        return ReviewerDashboardDTO.builder()
            .studyId(studyId)
            .studyTitle(studyTitle)
            .stats(stats)
            .suspiciousEvaluations(suspicious)
            .incompleteEvaluations(incomplete)
            .fastEvaluations(fast)
            .qualityDistribution(distribution)
            .participantSummaries(participantSummaries)
            .filterOptions(filterOptions)
            .evaluations(filtered)
            .fastThresholdSeconds(threshold)
            .build();
    }

    @Transactional(readOnly = true)
    public ReviewerComparisonDTO getComparison(Long studyId, Long taskId, Long reviewerId) {
        ensureReviewerAssignment(studyId, reviewerId);

        if (taskId == null) {
            throw new IllegalArgumentException("taskId is required for comparison");
        }

        List<EvaluationSubmission> submissions = submissionRepository
            .findByAssignmentEvaluationTaskStudyIdAndAssignmentEvaluationTaskId(studyId, taskId);

        if (submissions.isEmpty()) {
            throw new IllegalArgumentException("No submissions found for the provided task");
        }

        EvaluationSubmission first = submissions.get(0);
        String studyTitle = first.getAssignment().getEvaluationTask().getStudy() != null
            ? first.getAssignment().getEvaluationTask().getStudy().getTitle()
            : null;
        String taskTitle = first.getAssignment().getEvaluationTask().getTitle();
        String artifactType = first.getAssignment().getEvaluationTask().getTaskType() != null
            ? first.getAssignment().getEvaluationTask().getTaskType().getArtifactType().name()
            : "CUSTOM";

        List<ReviewerComparisonRowDTO> rows = submissions.stream()
            .map(this::mapToComparisonRow)
            .toList();

        return ReviewerComparisonDTO.builder()
            .studyId(studyId)
            .studyTitle(studyTitle)
            .taskId(taskId)
            .taskTitle(taskTitle)
            .artifactType(artifactType)
            .rows(rows)
            .build();
    }

    @Transactional(readOnly = true)
    public List<ReviewerReviewHistoryDTO> getReviewHistory(Long reviewerId) {
        List<EvaluationSubmission> submissions = submissionRepository
            .findByReviewedByIdOrderByReviewedAtDesc(reviewerId);

        return submissions.stream()
            .map(this::mapToHistoryItem)
            .toList();
    }

    private ReviewerEvaluationSummaryDTO mapToSummary(EvaluationSubmission submission) {
        ParticipantTaskAssignment assignment = submission.getAssignment();
        var task = assignment.getEvaluationTask();
        Integer annotations = submission != null ? resolveAnnotationCount(submission) : 0;

        return ReviewerEvaluationSummaryDTO.builder()
            .assignmentId(assignment.getId())
            .submissionId(submission.getId())
            .participantId(assignment.getParticipant().getId())
            .participantName(resolveReviewerParticipantLabel(assignment))
            .taskId(task.getId())
            .taskTitle(task.getTitle())
            .artifactType(task.getTaskType() != null ? task.getTaskType().getArtifactType().name() : "CUSTOM")
            .submittedAt(submission.getSubmittedAt())
            .timeSpentSeconds(submission.getTimeSpentSeconds())
            .reviewerStatus(submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : null)
            .reviewerQualityScore(submission.getReviewerQualityScore())
            .reviewerNotes(submission.getReviewerNotes())
            .annotationCount(annotations)
            .snapshotDecision(submission.getSnapshotDecision())
            .bugSeverity(submission.getBugSeverity())
            .cloneRelationship(submission.getCloneRelationship())
            .build();
    }

    private ParticipantTaskAssignment resolveAccessibleAssignment(Long assignmentId, Long reviewerId) {
        ParticipantTaskAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Long studyId = assignment.getEvaluationTask().getStudy() != null
            ? assignment.getEvaluationTask().getStudy().getId()
            : null;

        if (studyId == null) {
            throw new IllegalArgumentException("Assignment is not associated with a study");
        }

        ensureReviewerAssignment(studyId, reviewerId);
        if (!submissionRepository.existsByAssignmentId(assignmentId)) {
            throw new IllegalStateException("This assignment has not been submitted yet");
        }
        return assignment;
    }

    private ReviewerReviewHistoryDTO mapToHistoryItem(EvaluationSubmission submission) {
        ParticipantTaskAssignment assignment = submission.getAssignment();
        EvaluationTask task = assignment.getEvaluationTask();
        User participant = assignment.getParticipant();

        String decision = null;
        if (submission.getReviewerStatus() != null) {
            decision = switch (submission.getReviewerStatus()) {
                case VALID -> "approved";
                case SUSPICIOUS -> "flagged";
                case INCOMPLETE -> "incomplete";
            };
        }

        int issues = (int) annotationRepository.countByAssignmentId(assignment.getId());

        return ReviewerReviewHistoryDTO.builder()
            .id(submission.getId())
            .assignmentId(assignment.getId())
            .studyId(task.getStudy() != null ? task.getStudy().getId() : null)
            .studyName(task.getStudy() != null ? task.getStudy().getTitle() : null)
            .participantId(participant != null ? participant.getId() : null)
            .participantName(participant != null ? participant.getFullName() : null)
            .reviewDate(submission.getReviewedAt())
            .decision(decision)
            .qualityScore(submission.getReviewerQualityScore())
            .issuesFound(issues)
            .timeSpent(formatTimeSpent(submission.getTimeSpentSeconds()))
            .build();
    }

    private String formatTimeSpent(Integer seconds) {
        if (seconds == null || seconds <= 0) {
            return "—";
        }
        int mins = seconds / 60;
        int remaining = seconds % 60;
        if (mins <= 0) {
            return seconds + "s";
        }
        return mins + "m " + String.format("%02ds", remaining);
    }

    private List<ReviewerEvaluationSummaryDTO> applyFilters(
        List<ReviewerEvaluationSummaryDTO> summaries,
        ReviewerDashboardFilter filter
    ) {
        if (filter == null) {
            return summaries;
        }

        return summaries.stream()
            .filter(item -> filter.getParticipantId() == null || Objects.equals(item.getParticipantId(), filter.getParticipantId()))
            .filter(item -> filter.getReviewerStatus() == null || Objects.equals(item.getReviewerStatus(), filter.getReviewerStatus()))
            .filter(item -> filter.getTaskId() == null || Objects.equals(item.getTaskId(), filter.getTaskId()))
            .filter(item -> filter.getTaskType() == null || Objects.equals(item.getArtifactType(), filter.getTaskType()))
            .filter(item -> filter.getSubmittedFrom() == null || (item.getSubmittedAt() != null && !item.getSubmittedAt().isBefore(filter.getSubmittedFrom())))
            .filter(item -> filter.getSubmittedTo() == null || (item.getSubmittedAt() != null && !item.getSubmittedAt().isAfter(filter.getSubmittedTo())))
            .filter(item -> filter.getQualityScore() == null || Objects.equals(item.getReviewerQualityScore(), filter.getQualityScore()))
            .filter(item -> filter.getMinQualityScore() == null || (item.getReviewerQualityScore() != null && item.getReviewerQualityScore() >= filter.getMinQualityScore()))
            .filter(item -> filter.getMaxQualityScore() == null || (item.getReviewerQualityScore() != null && item.getReviewerQualityScore() <= filter.getMaxQualityScore()))
            .filter(item -> filter.getMinTimeSeconds() == null || (item.getTimeSpentSeconds() != null && item.getTimeSpentSeconds() >= filter.getMinTimeSeconds()))
            .filter(item -> filter.getMaxTimeSeconds() == null || (item.getTimeSpentSeconds() != null && item.getTimeSpentSeconds() <= filter.getMaxTimeSeconds()))
            .toList();
    }

    private Map<Integer, Long> buildQualityDistribution(List<ReviewerEvaluationSummaryDTO> summaries) {
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        summaries.stream()
            .map(ReviewerEvaluationSummaryDTO::getReviewerQualityScore)
            .filter(Objects::nonNull)
            .forEach(score -> distribution.merge(score, 1L, Long::sum));

        return distribution;
    }

    private ReviewerDashboardStatsDTO buildStats(
        List<ReviewerEvaluationSummaryDTO> summaries,
        List<ReviewerEvaluationSummaryDTO> fastEvaluations
    ) {
        long suspicious = summaries.stream()
            .filter(item -> "SUSPICIOUS".equals(item.getReviewerStatus()))
            .count();

        long incomplete = summaries.stream()
            .filter(item -> "INCOMPLETE".equals(item.getReviewerStatus()))
            .count();

        long valid = summaries.stream()
            .filter(item -> "VALID".equals(item.getReviewerStatus()))
            .count();

        Double averageQuality = summaries.stream()
            .map(ReviewerEvaluationSummaryDTO::getReviewerQualityScore)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .average()
            .orElse(Double.NaN);

        return ReviewerDashboardStatsDTO.builder()
            .totalEvaluations(summaries.size())
            .validEvaluations(valid)
            .suspiciousEvaluations(suspicious)
            .incompleteEvaluations(incomplete)
            .fastEvaluations(fastEvaluations.size())
            .averageQualityScore(Double.isNaN(averageQuality) ? null : averageQuality)
            .build();
    }

    private List<ReviewerParticipantSummaryDTO> buildParticipantSummaries(List<ReviewerEvaluationSummaryDTO> summaries) {
        Map<Long, List<ReviewerEvaluationSummaryDTO>> grouped = summaries.stream()
            .collect(Collectors.groupingBy(ReviewerEvaluationSummaryDTO::getParticipantId));

        return grouped.entrySet().stream()
            .map(entry -> {
                List<ReviewerEvaluationSummaryDTO> participantItems = entry.getValue();
                long suspicious = participantItems.stream()
                    .filter(item -> "SUSPICIOUS".equals(item.getReviewerStatus()))
                    .count();
                long incomplete = participantItems.stream()
                    .filter(item -> "INCOMPLETE".equals(item.getReviewerStatus()))
                    .count();
                Double avgQuality = participantItems.stream()
                    .map(ReviewerEvaluationSummaryDTO::getReviewerQualityScore)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(Double.NaN);

                return ReviewerParticipantSummaryDTO.builder()
                    .participantId(entry.getKey())
                    .participantName(participantItems.get(0).getParticipantName())
                    .evaluationCount(participantItems.size())
                    .suspiciousCount(suspicious)
                    .incompleteCount(incomplete)
                    .averageQualityScore(Double.isNaN(avgQuality) ? null : avgQuality)
                    .build();
            })
            .toList();
    }

    private ReviewerFilterOptionsDTO buildFilterOptions(List<ReviewerEvaluationSummaryDTO> summaries) {
        List<ReviewerFilterOptionsDTO.Option> participants = summaries.stream()
            .filter(item -> item.getParticipantId() != null)
            .collect(Collectors.toMap(
                ReviewerEvaluationSummaryDTO::getParticipantId,
                item -> ReviewerFilterOptionsDTO.Option.builder()
                    .id(item.getParticipantId())
                    .label(item.getParticipantName())
                    .build(),
                (existing, replacement) -> existing
            ))
            .values()
            .stream()
            .sorted(Comparator.comparing(ReviewerFilterOptionsDTO.Option::getLabel, Comparator.nullsLast(String::compareToIgnoreCase)))
            .toList();

        List<ReviewerFilterOptionsDTO.Option> tasks = summaries.stream()
            .filter(item -> item.getTaskId() != null)
            .collect(Collectors.toMap(
                ReviewerEvaluationSummaryDTO::getTaskId,
                item -> ReviewerFilterOptionsDTO.Option.builder()
                    .id(item.getTaskId())
                    .label(item.getTaskTitle())
                    .build(),
                (existing, replacement) -> existing
            ))
            .values()
            .stream()
            .sorted(Comparator.comparing(ReviewerFilterOptionsDTO.Option::getLabel, Comparator.nullsLast(String::compareToIgnoreCase)))
            .toList();

        List<String> statuses = Arrays.stream(EvaluationSubmission.ReviewerStatus.values())
            .map(Enum::name)
            .toList();

        List<String> taskTypes = summaries.stream()
            .map(ReviewerEvaluationSummaryDTO::getArtifactType)
            .filter(Objects::nonNull)
            .distinct()
            .sorted()
            .toList();

        List<Integer> qualityScores = summaries.stream()
            .map(ReviewerEvaluationSummaryDTO::getReviewerQualityScore)
            .filter(Objects::nonNull)
            .distinct()
            .sorted()
            .toList();

        return ReviewerFilterOptionsDTO.builder()
            .participants(participants)
            .tasks(tasks)
            .statuses(statuses)
            .taskTypes(taskTypes)
            .qualityScores(qualityScores)
            .build();
    }

    private ReviewerComparisonRowDTO mapToComparisonRow(EvaluationSubmission submission) {
        ParticipantTaskAssignment assignment = submission.getAssignment();
        Integer annotations = resolveAnnotationCount(submission);

        return ReviewerComparisonRowDTO.builder()
            .assignmentId(assignment.getId())
            .submissionId(submission.getId())
            .participantId(assignment.getParticipant().getId())
            .participantName(resolveReviewerParticipantLabel(assignment))
            .submittedAt(submission.getSubmittedAt())
            .timeSpentSeconds(submission.getTimeSpentSeconds())
            .annotationCount(annotations)
            .reviewerStatus(submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : null)
            .reviewerQualityScore(submission.getReviewerQualityScore())
            .submissionData(submission.getSubmissionData())
            .build();
    }

    private ReviewerAssignment ensureReviewerAssignment(Long studyId, Long reviewerId) {
        ReviewerAssignment assignment = reviewerAssignmentRepository
            .findByStudyIdAndReviewerId(studyId, reviewerId)
            .orElseThrow(() -> new IllegalStateException("You are not assigned to this study as a reviewer"));

        if (assignment.getStatus() == ReviewerAssignment.AssignmentStatus.DECLINED) {
            throw new IllegalStateException("Reviewer assignment is declined for this study");
        }
        return assignment;
    }

    private int resolveAnnotationCount(EvaluationSubmission submission) {
        if (submission == null) {
            return 0;
        }
        int persisted = (int) annotationRepository.countByAssignmentId(submission.getAssignment().getId());
        return persisted + getSnapshotAnnotationCount(submission.getAnnotationsSnapshot());
    }

    private int getSnapshotAnnotationCount(JsonNode annotationsSnapshot) {
        if (annotationsSnapshot == null) {
            return 0;
        }
        if (annotationsSnapshot.isArray()) {
            return annotationsSnapshot.size();
        }
        if (annotationsSnapshot.has("annotations") && annotationsSnapshot.get("annotations").isArray()) {
            return annotationsSnapshot.get("annotations").size();
        }
        return 0;
    }

    private EvaluationSubmission.ReviewerStatus parseStatus(String status) {
        if (status == null) {
            return null;
        }
        try {
            return EvaluationSubmission.ReviewerStatus.valueOf(status.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid reviewer status: " + status);
        }
    }

    private String resolveReviewerParticipantLabel(ParticipantTaskAssignment assignment) {
        if (assignment == null || assignment.getParticipant() == null) {
            return null;
        }
        boolean blinded = assignment.getEvaluationTask() != null
            && Boolean.TRUE.equals(assignment.getEvaluationTask().getBlindedMode());
        if (blinded) {
            return "ReviewerParticipant #" + assignment.getParticipant().getId();
        }
        return assignment.getParticipant().getFullName();
    }
}
