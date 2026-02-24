package com.artifactcomparator.service;

import com.artifactcomparator.dto.ReviewerAssignmentCreateDTO;
import com.artifactcomparator.dto.ReviewerAssignmentDTO;
import com.artifactcomparator.dto.ReviewerAssignmentResponseDTO;
import com.artifactcomparator.model.Notification;
import com.artifactcomparator.model.ReviewerAssignment;
import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.ParticipantEvaluationReviewRepository;
import com.artifactcomparator.repository.ReviewerAssignmentRepository;
import com.artifactcomparator.repository.StudyRepository;
import com.artifactcomparator.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewerAssignmentService {

    private final ReviewerAssignmentRepository assignmentRepository;
    private final StudyRepository studyRepository;
    private final UserRepository userRepository;
    private final ParticipantEvaluationReviewRepository evaluationReviewRepository;
    private final NotificationService notificationService;

    /**
     * Researcher assigns reviewers to a study
     */
    @Transactional
    public ReviewerAssignmentResponseDTO assignReviewersToStudy(ReviewerAssignmentCreateDTO dto) {
        User currentUser = getCurrentUser();

        // Optional: rol check (isteğe bağlı ama mantıklı)
        if (currentUser.getRole() != User.Role.RESEARCHER) {
            throw new IllegalStateException("Only researchers can assign reviewers to studies");
        }

        // Validate study
        Study study = studyRepository.findById(dto.getStudyId())
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Check if current user owns the study (Study.researcher alanını kullanıyoruz)
        if (!study.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only assign reviewers to your own studies");
        }

        // Validate reviewers
        List<User> reviewers = userRepository.findAllById(dto.getReviewerIds());
        if (reviewers.size() != dto.getReviewerIds().size()) {
            throw new IllegalArgumentException("Some reviewer IDs are invalid");
        }

        // Check if all users are reviewers
        List<User> nonReviewers = reviewers.stream()
                .filter(user -> user.getRole() != User.Role.REVIEWER)
                .toList();
        if (!nonReviewers.isEmpty()) {
            throw new IllegalArgumentException("Some selected users are not reviewers");
        }

        List<ReviewerAssignment> assignments = new ArrayList<>();
        List<String> alreadyAssigned = new ArrayList<>();
        int successCount = 0;

        // Bu aşamada gerçek "tamamlanmış evaluation" sayısını bilmiyoruz,
        // o yüzden workload tahmini için maxParticipants'ı kullanıyoruz (null ise 0)
        int totalEvaluations = study.getMaxParticipants() != null ? study.getMaxParticipants() : 0;

        for (User reviewer : reviewers) {
            // Check if already assigned
            if (assignmentRepository.hasActiveAssignment(study.getId(), reviewer.getId())) {
                alreadyAssigned.add(reviewer.getFullName());
                continue;
            }

            // Create assignment
            ReviewerAssignment assignment = ReviewerAssignment.builder()
                    .study(study)
                    .reviewer(reviewer)
                    .assignedBy(currentUser)
                    .status(ReviewerAssignment.AssignmentStatus.PENDING)
                    .totalEvaluations(totalEvaluations)
                    .build();

            assignment = assignmentRepository.save(assignment);
            assignments.add(assignment);
            successCount++;

            // Create notification for reviewer
            notificationService.createNotification(
                    reviewer,
                    currentUser,
                    Notification.NotificationType.REVIEW_ASSIGNED,
                    "New Review Assignment",
                    currentUser.getFullName() + " assigned you to review evaluations for study \"" +
                            study.getTitle() + "\"",
                    Notification.RelatedEntityType.STUDY,
                    study.getId()
            );

            log.info("Assigned reviewer {} to study {} by researcher {}",
                    reviewer.getId(), study.getId(), currentUser.getId());
        }

        return ReviewerAssignmentResponseDTO.builder()
                .success(true)
                .message(successCount + " reviewer(s) assigned successfully")
                .assignedCount(successCount)
                .alreadyAssignedCount(alreadyAssigned.size())
                .alreadyAssignedReviewers(alreadyAssigned)
                .assignmentIds(assignments.stream().map(ReviewerAssignment::getId).collect(Collectors.toList()))
                .build();
    }

    /**
     * Get reviewer's assignments (for reviewer dashboard)
     */
    @Transactional(readOnly = true)
    public List<ReviewerAssignmentDTO> getMyAssignments() {
        User reviewer = getCurrentUser();

        if (reviewer.getRole() != User.Role.REVIEWER) {
            throw new IllegalStateException("Only reviewers can access assignments");
        }

        List<ReviewerAssignment> assignments = assignmentRepository
                .findByReviewerIdOrderByAssignedAtDesc(reviewer.getId());

        return assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending assignments for reviewer
     */
    @Transactional(readOnly = true)
    public List<ReviewerAssignmentDTO> getPendingAssignments() {
        User reviewer = getCurrentUser();

        List<ReviewerAssignment> assignments = assignmentRepository
                .findByReviewerIdAndStatusOrderByAssignedAtDesc(
                        reviewer.getId(),
                        ReviewerAssignment.AssignmentStatus.PENDING
                );

        return assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get active assignments (accepted/in-progress)
     */
    @Transactional(readOnly = true)
    public List<ReviewerAssignmentDTO> getActiveAssignments() {
        User reviewer = getCurrentUser();

        List<ReviewerAssignment> assignments = assignmentRepository
                .findByReviewerIdAndStatusInOrderByAssignedAtDesc(
                        reviewer.getId(),
                        List.of(
                                ReviewerAssignment.AssignmentStatus.ACCEPTED,
                                ReviewerAssignment.AssignmentStatus.IN_PROGRESS
                        )
                );

        return assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get assignments by study (for researcher)
     */
    @Transactional(readOnly = true)
    public List<ReviewerAssignmentDTO> getAssignmentsByStudy(Long studyId) {
        User currentUser = getCurrentUser();

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Yine Study.researcher ile sahiplik kontrolü
        if (!study.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only view assignments for your own studies");
        }

        List<ReviewerAssignment> assignments = assignmentRepository
                .findByStudyIdOrderByAssignedAtDesc(studyId);

        return assignments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Reviewer accepts assignment
     */
    @Transactional
    public ReviewerAssignmentDTO acceptAssignment(Long assignmentId) {
        User reviewer = getCurrentUser();

        ReviewerAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getReviewer().getId().equals(reviewer.getId())) {
            throw new IllegalStateException("You can only accept your own assignments");
        }

        assignment.accept();
        assignment = assignmentRepository.save(assignment);

        // Notify researcher
        notificationService.createNotification(
                assignment.getAssignedBy(),
                reviewer,
                Notification.NotificationType.SYSTEM_ALERT,
                "Review Assignment Accepted",
                reviewer.getFullName() + " accepted the review assignment for \"" +
                        assignment.getStudy().getTitle() + "\"",
                Notification.RelatedEntityType.STUDY,
                assignment.getStudy().getId()
        );

        log.info("Reviewer {} accepted assignment {}", reviewer.getId(), assignmentId);

        return convertToDTO(assignment);
    }

    /**
     * Reviewer declines assignment
     */
    @Transactional
    public ReviewerAssignmentDTO declineAssignment(Long assignmentId, String reason) {
        User reviewer = getCurrentUser();

        ReviewerAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getReviewer().getId().equals(reviewer.getId())) {
            throw new IllegalStateException("You can only decline your own assignments");
        }

        assignment.decline(reason);
        assignment = assignmentRepository.save(assignment);

        // Notify researcher
        notificationService.createNotification(
                assignment.getAssignedBy(),
                reviewer,
                Notification.NotificationType.SYSTEM_ALERT,
                "Review Assignment Declined",
                reviewer.getFullName() + " declined the review assignment for \"" +
                        assignment.getStudy().getTitle() + "\"" +
                        (reason != null ? ": " + reason : ""),
                Notification.RelatedEntityType.STUDY,
                assignment.getStudy().getId()
        );

        log.info("Reviewer {} declined assignment {}", reviewer.getId(), assignmentId);

        return convertToDTO(assignment);
    }

    /**
     * Delete assignment (researcher only)
     */
    @Transactional
    public void deleteAssignment(Long assignmentId) {
        User currentUser = getCurrentUser();

        ReviewerAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        // Sadece kendi oluşturduğu assignment'ı silebilsin
        if (!assignment.getAssignedBy().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only delete assignments you created");
        }

        if (assignment.getStatus() == ReviewerAssignment.AssignmentStatus.IN_PROGRESS ||
            assignment.getStatus() == ReviewerAssignment.AssignmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot delete assignments that are in progress or completed");
        }

        assignmentRepository.delete(assignment);

        log.info("Researcher {} deleted assignment {}", currentUser.getId(), assignmentId);
    }

    // Helper methods

    private ReviewerAssignmentDTO convertToDTO(ReviewerAssignment assignment) {
        // Study tarafında gerçek participant listesi henüz yok, o yüzden maxParticipants'ı kullanıyoruz
        int totalParticipants = assignment.getStudy().getMaxParticipants() != null
                ? assignment.getStudy().getMaxParticipants()
                : 0;

        return ReviewerAssignmentDTO.builder()
                .id(assignment.getId())
                .studyId(assignment.getStudy().getId())
                .studyTitle(assignment.getStudy().getTitle())
                .studyDescription(assignment.getStudy().getDescription())
                .reviewerId(assignment.getReviewer().getId())
                .reviewerName(assignment.getReviewer().getFullName())
                .reviewerEmail(assignment.getReviewer().getEmail())
                .assignedById(assignment.getAssignedBy().getId())
                .assignedByName(assignment.getAssignedBy().getFullName())
                .status(assignment.getStatus())
                .assignedAt(assignment.getAssignedAt())
                .acceptedAt(assignment.getAcceptedAt())
                .declinedAt(assignment.getDeclinedAt())
                .completedAt(assignment.getCompletedAt())
                .declineReason(assignment.getDeclineReason())
                .reviewerNotes(assignment.getReviewerNotes())
                .totalEvaluations(assignment.getTotalEvaluations())
                .reviewedEvaluations(assignment.getReviewedEvaluations())
                .acceptedEvaluations(assignment.getAcceptedEvaluations())
                .rejectedEvaluations(assignment.getRejectedEvaluations())
                .flaggedEvaluations(assignment.getFlaggedEvaluations())
                .progressPercentage(assignment.getProgressPercentage())
                .totalParticipants(totalParticipants)
                .canAccept(assignment.getStatus() == ReviewerAssignment.AssignmentStatus.PENDING)
                .canDecline(assignment.getStatus() == ReviewerAssignment.AssignmentStatus.PENDING)
                .canReview(assignment.getStatus() == ReviewerAssignment.AssignmentStatus.ACCEPTED ||
                           assignment.getStatus() == ReviewerAssignment.AssignmentStatus.IN_PROGRESS)
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
}
