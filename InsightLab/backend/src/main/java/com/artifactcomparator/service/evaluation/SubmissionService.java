package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.*;
import com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO;
import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.evaluation.*;
import com.artifactcomparator.repository.ArtifactRepository;
import com.artifactcomparator.repository.evaluation.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final EvaluationSubmissionRepository submissionRepository;
    private final ParticipantTaskAssignmentRepository assignmentRepository;
    private final ScoreEntryRepository scoreEntryRepository;
    private final EvaluationAnnotationRepository annotationRepository;
    private final CriteriaItemRepository criteriaRepository;
    private final EvaluationTaskRepository evaluationTaskRepository;
    private final ArtifactMappingService artifactMappingService;
    private final ArtifactRepository storedArtifactRepository;
    private final ObjectMapper objectMapper;
    private static final Set<String> ALLOWED_CLONE_RELATIONSHIPS = Set.of(
        "EXACT_COPY",
        "RENAMED_COPY",
        "RESTRUCTURED_COPY",
        "DIFFERENT_IMPLEMENTATION",
        "NO_RELATION"
    );
    private static final Set<String> ALLOWED_BUG_SEVERITIES = Set.of(
        "Critical",
        "Major",
        "Moderate",
        "Minor",
        "Trivial"
    );
    private static final Set<String> ALLOWED_BUG_REPRODUCIBLE = Set.of(
        "YES",
        "NO",
        "UNCLEAR"
    );
    private static final Set<String> ALLOWED_BUG_CATEGORIES = Set.of(
        "UI Bug",
        "Functional Bug",
        "Performance Issue",
        "Security Issue",
        "Compatibility Issue",
        "Other"
    );
    private static final Set<String> ALLOWED_SOLID_PRINCIPLES = Set.of(
        "Single Responsibility Principle (SRP)",
        "Open/Closed Principle (OCP)",
        "Liskov Substitution Principle (LSP)",
        "Interface Segregation Principle (ISP)",
        "Dependency Inversion Principle (DIP)",
        "None / No Violation"
    );
    private static final Set<String> ALLOWED_SOLID_SEVERITY = Set.of(
        "Critical",
        "Major",
        "Moderate",
        "Minor",
        "Very Minor"
    );

    @Transactional
    public SubmissionDTO submitEvaluation(Long assignmentId, SubmissionRequestDTO request, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getStatus() == ParticipantTaskAssignment.AssignmentStatus.SUBMITTED) {
            throw new IllegalStateException("Already submitted");
        }

        // Validate all required criteria are filled
        ValidationResult validation = validateSubmission(assignment, request);
        if (!validation.isValid()) {
            throw new SubmissionValidationException(validation.getErrors());
        }

        // Create submission record
        EvaluationSubmission submission = new EvaluationSubmission();
        submission.setAssignment(assignment);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setTimeSpentSeconds(request.getTimeSpentSeconds());
        submission.setIsLocked(true);
        submission.setSnapshotDecision(request.getSnapshotDecision());
        submission.setSnapshotExplanation(request.getSnapshotExplanation());
        submission.setSnapshotConfidence(request.getSnapshotConfidence());
        submission.setCloneRelationship(request.getCloneRelationship());
        submission.setCloneSimilarity(request.getCloneSimilarity());
        submission.setCloneNotes(request.getCloneNotes());
        submission.setBugSeverity(request.getBugSeverity());
        submission.setBugReproducible(request.getBugReproducible());
        submission.setBugCategory(request.getBugCategory());
        submission.setBugNotes(request.getBugNotes());
        submission.setSolidViolatedPrinciple(request.getSolidViolatedPrinciple());
        submission.setSolidViolationSeverity(request.getSolidViolationSeverity());
        submission.setSolidExplanation(request.getSolidExplanation());
        submission.setSolidSuggestedFix(request.getSolidSuggestedFix());

        // Snapshot all data
        submission.setSubmissionData(createSubmissionSnapshot(assignment, request));
        if (request.getAnswers() != null) {
            submission.setAnswers(objectMapper.valueToTree(request.getAnswers()));
        }
        if (request.getAnnotations() != null) {
            submission.setAnnotationsSnapshot(request.getAnnotations());
        }
        submission.setValidationErrors(null); // No errors since validation passed

        submission = submissionRepository.save(submission);

        // Update assignment status
        assignment.setStatus(ParticipantTaskAssignment.AssignmentStatus.SUBMITTED);
        assignment.setSubmittedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        return convertToDTO(submission);
    }

    @Transactional(readOnly = true)
    public SubmissionDTO getSubmission(Long assignmentId, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        return submissionRepository.findByAssignmentId(assignmentId)
            .map(this::convertToDTO)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<SubmissionReviewSummaryDTO> getTaskSubmissionSummaries(Long taskId, Long researcherId) {
        EvaluationTask task = getOwnedTask(taskId, researcherId);

        List<ParticipantTaskAssignment> assignments = assignmentRepository.findByEvaluationTaskId(taskId);
        Map<Long, EvaluationSubmission> submissionMap = submissionRepository
            .findByAssignmentEvaluationTaskId(taskId)
            .stream()
            .collect(Collectors.toMap(
                submission -> submission.getAssignment().getId(),
                Function.identity()
            ));

        return assignments.stream()
            .map(assignment -> buildSummaryDTO(task, assignment, submissionMap.get(assignment.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public SubmissionReviewDetailDTO getSubmissionDetail(Long taskId, Long assignmentId, Long researcherId) {
        EvaluationTask task = getOwnedTask(taskId, researcherId);

        ParticipantTaskAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getEvaluationTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Assignment does not belong to this evaluation task");
        }

        return buildSubmissionDetailResponse(assignment, false);
    }

    @Transactional(readOnly = true)
    public SubmissionReviewDetailDTO buildSubmissionDetailForReviewer(ParticipantTaskAssignment assignment) {
        boolean anonymizeParticipant = assignment.getEvaluationTask() != null
            && Boolean.TRUE.equals(assignment.getEvaluationTask().getBlindedMode());
        return buildSubmissionDetailResponse(assignment, anonymizeParticipant);
    }

    @Transactional(readOnly = true)
    public SubmissionExportResult exportTaskSubmissions(Long taskId, Long researcherId, String format) {
        EvaluationTask task = getOwnedTask(taskId, researcherId);
        List<ParticipantTaskAssignment> assignments = assignmentRepository.findByEvaluationTaskId(taskId);
        Map<Long, EvaluationSubmission> submissionMap = submissionRepository
            .findByAssignmentEvaluationTaskId(taskId)
            .stream()
            .collect(Collectors.toMap(
                submission -> submission.getAssignment().getId(),
                Function.identity()
            ));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (ParticipantTaskAssignment assignment : assignments) {
            EvaluationSubmission submission = submissionMap.get(assignment.getId());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("taskId", taskId);
            row.put("taskTitle", task.getTitle());
            row.put("studyId", task.getStudy() != null ? task.getStudy().getId() : null);
            row.put("studyTitle", task.getStudy() != null ? task.getStudy().getTitle() : null);
            row.put("artifactType", task.getTaskType() != null ? task.getTaskType().getArtifactType().name() : null);
            row.put("assignmentId", assignment.getId());
            row.put("participantId", assignment.getParticipant().getId());
            row.put("participantName", assignment.getParticipant().getFullName());
            row.put("participantEmail", assignment.getParticipant().getEmail());
            row.put("participantUsername", assignment.getParticipant().getUsername());
            row.put("status", assignment.getStatus().name());
            row.put("submitted", submission != null);
            row.put("assignedAt", assignment.getAssignedAt());
            row.put("startedAt", assignment.getStartedAt());
            row.put("submittedAt", assignment.getSubmittedAt());
            row.put("timeSpentSeconds", submission != null ? submission.getTimeSpentSeconds() : null);
            
            // Reviewer evaluation information
            row.put("reviewerStatus", submission != null && submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : null);
            row.put("reviewerNotes", submission != null ? submission.getReviewerNotes() : null);
            row.put("reviewerQualityScore", submission != null ? submission.getReviewerQualityScore() : null);
            row.put("reviewedById", submission != null && submission.getReviewedBy() != null ? submission.getReviewedBy().getId() : null);
            row.put("reviewedByName", submission != null && submission.getReviewedBy() != null ? submission.getReviewedBy().getFullName() : null);
            row.put("reviewedAt", submission != null ? submission.getReviewedAt() : null);

            // Participant Criteria Responses
            List<Map<String, Object>> criteriaResponses = new ArrayList<>();
            List<ScoreEntry> scores = scoreEntryRepository.findByAssignmentId(assignment.getId());
            for (ScoreEntry score : scores) {
                Map<String, Object> criteriaResponse = new LinkedHashMap<>();
                CriteriaItem criteriaItem = score.getCriteriaItem();
                criteriaResponse.put("criteriaName", criteriaItem != null ? criteriaItem.getName() : "Unknown");
                criteriaResponse.put("criteriaId", criteriaItem != null ? criteriaItem.getId() : null);
                criteriaResponse.put("value", score.getValue());
                criteriaResponse.put("notes", score.getNotes());
                criteriaResponses.add(criteriaResponse);
            }
            
            // Also include dynamic criteria from submission answers if available
            if (submission != null && submission.getAnswers() != null) {
                JsonNode answers = submission.getAnswers();
                boolean isSideBySide = task.getLayoutMode() == EvaluationTask.LayoutMode.SIDE_BY_SIDE;
                boolean isThreeWay = task.getLayoutMode() == EvaluationTask.LayoutMode.THREE_WAY;
                boolean isSingle = task.getLayoutMode() == EvaluationTask.LayoutMode.SINGLE;
                int pairCount = 0;
                int tripletCount = 0;
                int singleCount = 0;
                if (isSideBySide && task.getArtifacts() != null) {
                    pairCount = (task.getArtifacts().size() + 1) / 2;
                }
                if (isThreeWay && task.getArtifacts() != null) {
                    tripletCount = (task.getArtifacts().size() + 2) / 3;
                }
                if (isSingle && task.getArtifacts() != null) {
                    singleCount = task.getArtifacts().size();
                }
                
                if (task.getCriteria() != null) {
                    for (EvaluationCriterionDefinition criterion : task.getCriteria()) {
                        if (isSingle && singleCount > 0) {
                            // For single mode, collect answers for each artifact
                            List<Map<String, Object>> singleResponses = new ArrayList<>();
                            for (int i = 0; i < singleCount; i++) {
                                String singleKey = "single_" + i + "_" + criterion.getId();
                                JsonNode answerValue = answers.get(singleKey);
                                if (answerValue != null && !answerValue.isNull()) {
                                    Map<String, Object> singleResponse = new LinkedHashMap<>();
                                    singleResponse.put("artifactIndex", i + 1);
                                    singleResponse.put("value", answerValue.isTextual() ? answerValue.asText() : answerValue.toString());
                                    singleResponses.add(singleResponse);
                                }
                            }
                            if (!singleResponses.isEmpty()) {
                                Map<String, Object> criteriaResponse = new LinkedHashMap<>();
                                criteriaResponse.put("criteriaName", criterion.getName());
                                criteriaResponse.put("criteriaId", criterion.getId());
                                criteriaResponse.put("singleResponses", singleResponses);
                                criteriaResponse.put("notes", null);
                                criteriaResponses.add(criteriaResponse);
                            }
                        } else if (isThreeWay && tripletCount > 0) {
                            // For three-way mode, collect answers for each triplet
                            List<Map<String, Object>> tripletResponses = new ArrayList<>();
                            for (int i = 0; i < tripletCount; i++) {
                                String tripletKey = "triplet_" + i + "_" + criterion.getId();
                                JsonNode answerValue = answers.get(tripletKey);
                                if (answerValue != null && !answerValue.isNull()) {
                                    Map<String, Object> tripletResponse = new LinkedHashMap<>();
                                    tripletResponse.put("tripletIndex", i + 1);
                                    tripletResponse.put("value", answerValue.isTextual() ? answerValue.asText() : answerValue.toString());
                                    tripletResponses.add(tripletResponse);
                                }
                            }
                            if (!tripletResponses.isEmpty()) {
                                Map<String, Object> criteriaResponse = new LinkedHashMap<>();
                                criteriaResponse.put("criteriaName", criterion.getName());
                                criteriaResponse.put("criteriaId", criterion.getId());
                                criteriaResponse.put("tripletResponses", tripletResponses);
                                criteriaResponse.put("notes", null);
                                criteriaResponses.add(criteriaResponse);
                            }
                        } else if (isSideBySide && pairCount > 0) {
                            // For side-by-side mode, collect answers for each pair
                            List<Map<String, Object>> pairResponses = new ArrayList<>();
                            for (int i = 0; i < pairCount; i++) {
                                String pairKey = "pair_" + i + "_" + criterion.getId();
                                JsonNode answerValue = answers.get(pairKey);
                                if (answerValue != null && !answerValue.isNull()) {
                                    Map<String, Object> pairResponse = new LinkedHashMap<>();
                                    pairResponse.put("pairIndex", i + 1);
                                    pairResponse.put("value", answerValue.isTextual() ? answerValue.asText() : answerValue.toString());
                                    pairResponses.add(pairResponse);
                                }
                            }
                            if (!pairResponses.isEmpty()) {
                                Map<String, Object> criteriaResponse = new LinkedHashMap<>();
                                criteriaResponse.put("criteriaName", criterion.getName());
                                criteriaResponse.put("criteriaId", criterion.getId());
                                criteriaResponse.put("pairResponses", pairResponses);
                                criteriaResponse.put("notes", null);
                                criteriaResponses.add(criteriaResponse);
                            }
                        } else {
                            // Normal mode
                            JsonNode answerValue = answers.get(criterion.getId().toString());
                            if (answerValue != null && !answerValue.isNull()) {
                                Map<String, Object> criteriaResponse = new LinkedHashMap<>();
                                criteriaResponse.put("criteriaName", criterion.getName());
                                criteriaResponse.put("criteriaId", criterion.getId());
                                criteriaResponse.put("value", answerValue.isTextual() ? answerValue.asText() : answerValue.toString());
                                criteriaResponse.put("notes", null);
                                criteriaResponses.add(criteriaResponse);
                            }
                        }
                    }
                }
            }
            
            row.put("criteriaResponses", criteriaResponses);

            List<Map<String, Object>> annotationSummaries = new ArrayList<>();
            annotationRepository.findByAssignmentId(assignment.getId()).forEach(annotation -> {
                Map<String, Object> annotationMap = new LinkedHashMap<>();
                annotationMap.put("type", annotation.getAnnotationType().name());
                annotationMap.put("panelNumber", annotation.getPanelNumber());
                annotationMap.put("content", annotation.getContent());
                annotationSummaries.add(annotationMap);
            });

            if (submission != null) {
                annotationSummaries.addAll(buildSnapshotAnnotationSummaries(submission.getAnnotationsSnapshot()));
            }

            row.put("annotations", annotationSummaries);
            row.put("annotationCount", annotationSummaries.size());

            rows.add(row);
        }

        try {
            if ("json".equalsIgnoreCase(format)) {
                byte[] data = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(rows);
                return new SubmissionExportResult(
                    data,
                    buildExportFileName(taskId, "json"),
                    "application/json"
                );
            } else if ("pdf".equalsIgnoreCase(format)) {
                byte[] pdfData = exportSubmissionsAsPDF(task, rows);
                return new SubmissionExportResult(
                    pdfData,
                    buildExportFileName(taskId, "pdf"),
                    "application/pdf"
                );
            } else if ("xlsx".equalsIgnoreCase(format) || "excel".equalsIgnoreCase(format)) {
                byte[] excelData = exportSubmissionsAsExcel(task, rows);
                return new SubmissionExportResult(
                    excelData,
                    buildExportFileName(taskId, "xlsx"),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
            }

            String csv = convertRowsToCsv(rows);
            return new SubmissionExportResult(
                csv.getBytes(StandardCharsets.UTF_8),
                buildExportFileName(taskId, "csv"),
                "text/csv"
            );
        } catch (Exception e) {
            throw new IllegalStateException("Failed to export submissions", e);
        }
    }

    private ValidationResult validateSubmission(ParticipantTaskAssignment assignment, SubmissionRequestDTO request) {
        ValidationResult result = new ValidationResult();

        EvaluationTask task = assignment.getEvaluationTask();
        TaskType taskType = task.getTaskType();

        if (task.getCriteria() != null && !task.getCriteria().isEmpty()) {
            validateDynamicCriteria(task, request, result);
        }

        if (taskType == null) {
            return result;
        }

        // Get required criteria
        List<CriteriaItem> requiredCriteria = criteriaRepository
            .findByTaskTypeIdAndIsRequiredTrue(taskType.getId());

        // Get filled scores
        List<ScoreEntry> scores = scoreEntryRepository.findByAssignmentId(assignment.getId());
        Set<Long> filledCriteriaIds = scores.stream()
            .map(s -> s.getCriteriaItem().getId())
            .collect(Collectors.toSet());

        // Check missing required criteria
        for (CriteriaItem criteria : requiredCriteria) {
            if (!filledCriteriaIds.contains(criteria.getId())) {
                result.addError("Required field not filled: " + criteria.getName());
            }
        }

        if (taskType.getArtifactType() == TaskType.ArtifactType.SNAPSHOT) {
            String decision = request.getSnapshotDecision();
            if (decision == null || decision.isBlank()) {
                result.addError("Snapshot decision is required");
            } else if (!decision.equals("BUG") && !decision.equals("EXPECTED_CHANGE")) {
                result.addError("Invalid snapshot decision value");
            }
        }

        if (taskType.getArtifactType() == TaskType.ArtifactType.CODE_CLONE) {
            String relationship = request.getCloneRelationship();
            if (relationship == null || relationship.isBlank()) {
                result.addError("Clone relationship is required");
            } else if (!ALLOWED_CLONE_RELATIONSHIPS.contains(relationship)) {
                result.addError("Invalid clone relationship value");
            }

            Double similarity = request.getCloneSimilarity();
            if (similarity != null && (similarity < 0 || similarity > 100)) {
                result.addError("Similarity score must be between 0 and 100");
            }
        }

        if (taskType.getArtifactType() == TaskType.ArtifactType.BUG_REPORT) {
            String severity = request.getBugSeverity();
            if (severity == null || severity.isBlank()) {
                result.addError("Bug severity is required");
            } else if (!ALLOWED_BUG_SEVERITIES.contains(severity)) {
                result.addError("Invalid bug severity value");
            }

            String reproducible = request.getBugReproducible();
            if (reproducible == null || reproducible.isBlank()) {
                result.addError("Reproducibility selection is required");
            } else if (!ALLOWED_BUG_REPRODUCIBLE.contains(reproducible)) {
                result.addError("Invalid reproducibility value");
            }

            if (request.getBugCategory() != null && !request.getBugCategory().isBlank()) {
                if (!ALLOWED_BUG_CATEGORIES.contains(request.getBugCategory())) {
                    result.addError("Invalid bug category value");
                }
            }
        }

        if (taskType.getArtifactType() == TaskType.ArtifactType.SOLID_VIOLATION) {
            String principle = request.getSolidViolatedPrinciple();
            if (principle == null || principle.isBlank()) {
                result.addError("SOLID principle selection is required");
            } else if (!ALLOWED_SOLID_PRINCIPLES.contains(principle)) {
                result.addError("Invalid SOLID principle value");
            }

            if (request.getSolidViolationSeverity() != null && !request.getSolidViolationSeverity().isBlank()) {
                if (!ALLOWED_SOLID_SEVERITY.contains(request.getSolidViolationSeverity())) {
                    result.addError("Invalid SOLID violation severity");
                }
            }
        }

        return result;
    }

    private JsonNode createSubmissionSnapshot(ParticipantTaskAssignment assignment, SubmissionRequestDTO request) {
        ObjectNode snapshot = objectMapper.createObjectNode();

        // Scores
        List<ScoreEntry> scores = scoreEntryRepository.findByAssignmentId(assignment.getId());
        ArrayNode scoresArray = objectMapper.createArrayNode();
        for (ScoreEntry score : scores) {
            ObjectNode scoreNode = objectMapper.createObjectNode();
            scoreNode.put("criteriaItemId", score.getCriteriaItem().getId());
            scoreNode.put("criteriaName", score.getCriteriaItem().getName());
            scoreNode.set("value", score.getValue());
            scoreNode.put("notes", score.getNotes());
            scoresArray.add(scoreNode);
        }
        snapshot.set("scores", scoresArray);

        // Annotations
        if (request.getAnnotations() != null) {
            snapshot.set("annotations", request.getAnnotations());
        } else {
            List<EvaluationAnnotation> annotations = annotationRepository.findByAssignmentId(assignment.getId());
            ArrayNode annotationsArray = objectMapper.createArrayNode();
            for (EvaluationAnnotation annotation : annotations) {
                ObjectNode annotationNode = objectMapper.createObjectNode();
                annotationNode.put("artifactId", annotation.getArtifactId().toString());
                annotationNode.put("panelNumber", annotation.getPanelNumber());
                annotationNode.put("type", annotation.getAnnotationType().name());
                annotationNode.put("content", annotation.getContent());
                annotationNode.put("startLine", annotation.getStartLine());
                annotationNode.put("endLine", annotation.getEndLine());
                annotationNode.put("color", annotation.getColor());
                annotationsArray.add(annotationNode);
            }
            snapshot.set("annotations", annotationsArray);
        }

        // Metadata
        snapshot.put("assignmentId", assignment.getId());
        snapshot.put("taskId", assignment.getEvaluationTask().getId());
        snapshot.put("participantId", assignment.getParticipant().getId());
        snapshot.put("submittedAt", LocalDateTime.now().toString());
        if (request.getSnapshotDecision() != null) {
            snapshot.put("snapshotDecision", request.getSnapshotDecision());
        }
        if (request.getSnapshotExplanation() != null) {
            snapshot.put("snapshotExplanation", request.getSnapshotExplanation());
        }
        if (request.getSnapshotConfidence() != null) {
            snapshot.put("snapshotConfidence", request.getSnapshotConfidence());
        }
        if (request.getCloneRelationship() != null) {
            snapshot.put("cloneRelationship", request.getCloneRelationship());
        }
        if (request.getCloneSimilarity() != null) {
            snapshot.put("cloneSimilarity", request.getCloneSimilarity());
        }
        if (request.getCloneNotes() != null) {
            snapshot.put("cloneNotes", request.getCloneNotes());
        }
        if (request.getBugSeverity() != null) {
            snapshot.put("bugSeverity", request.getBugSeverity());
        }
        if (request.getBugReproducible() != null) {
            snapshot.put("bugReproducible", request.getBugReproducible());
        }
        if (request.getBugCategory() != null) {
            snapshot.put("bugCategory", request.getBugCategory());
        }
        if (request.getBugNotes() != null) {
            snapshot.put("bugNotes", request.getBugNotes());
        }
        if (request.getSolidViolatedPrinciple() != null) {
            snapshot.put("solidViolatedPrinciple", request.getSolidViolatedPrinciple());
        }
        if (request.getSolidViolationSeverity() != null) {
            snapshot.put("solidViolationSeverity", request.getSolidViolationSeverity());
        }
        if (request.getSolidExplanation() != null) {
            snapshot.put("solidExplanation", request.getSolidExplanation());
        }
        if (request.getSolidSuggestedFix() != null) {
            snapshot.put("solidSuggestedFix", request.getSolidSuggestedFix());
        }

        return snapshot;
    }

    public SubmissionDTO convertToDTO(EvaluationSubmission submission) {
        return SubmissionDTO.builder()
            .id(submission.getId())
            .assignmentId(submission.getAssignment().getId())
            .submittedAt(submission.getSubmittedAt())
            .timeSpentSeconds(submission.getTimeSpentSeconds())
            .isLocked(submission.getIsLocked())
            .submissionData(submission.getSubmissionData())
            .answers(submission.getAnswers())
            .annotationsSnapshot(submission.getAnnotationsSnapshot())
            .validationErrors(submission.getValidationErrors())
            .snapshotDecision(submission.getSnapshotDecision())
            .snapshotExplanation(submission.getSnapshotExplanation())
            .snapshotConfidence(submission.getSnapshotConfidence())
            .cloneRelationship(submission.getCloneRelationship())
            .cloneSimilarity(submission.getCloneSimilarity())
            .cloneNotes(submission.getCloneNotes())
            .bugSeverity(submission.getBugSeverity())
            .bugReproducible(submission.getBugReproducible())
            .bugCategory(submission.getBugCategory())
            .bugNotes(submission.getBugNotes())
            .solidViolatedPrinciple(submission.getSolidViolatedPrinciple())
            .solidViolationSeverity(submission.getSolidViolationSeverity())
            .solidExplanation(submission.getSolidExplanation())
            .solidSuggestedFix(submission.getSolidSuggestedFix())
            .reviewerStatus(submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : null)
            .reviewerNotes(submission.getReviewerNotes())
            .reviewerQualityScore(submission.getReviewerQualityScore())
            .reviewedAt(submission.getReviewedAt())
            .reviewedById(submission.getReviewedBy() != null ? submission.getReviewedBy().getId() : null)
            .reviewedByName(submission.getReviewedBy() != null ? submission.getReviewedBy().getFullName() : null)
            .build();
    }

    private SubmissionReviewSummaryDTO buildSummaryDTO(
        EvaluationTask task,
        ParticipantTaskAssignment assignment,
        EvaluationSubmission submission
    ) {
        return SubmissionReviewSummaryDTO.builder()
            .assignmentId(assignment.getId())
            .submissionId(submission != null ? submission.getId() : null)
            .taskId(task.getId())
            .taskTitle(task.getTitle())
            .studyId(task.getStudy() != null ? task.getStudy().getId() : null)
            .studyTitle(task.getStudy() != null ? task.getStudy().getTitle() : null)
            .artifactType(task.getTaskType() != null ? task.getTaskType().getArtifactType().name() : null)
            .participantId(assignment.getParticipant().getId())
            .participantName(assignment.getParticipant().getFullName())
            .participantEmail(assignment.getParticipant().getEmail())
            .participantUsername(assignment.getParticipant().getUsername())
            .status(assignment.getStatus().name())
            .assignedAt(assignment.getAssignedAt())
            .startedAt(assignment.getStartedAt())
            .dueDate(assignment.getDueDate())
            .submittedAt(assignment.getSubmittedAt())
            .timeSpentSeconds(submission != null ? submission.getTimeSpentSeconds() : null)
            .submitted(submission != null)
            .snapshotDecision(submission != null ? submission.getSnapshotDecision() : null)
            .snapshotExplanation(submission != null ? submission.getSnapshotExplanation() : null)
            .snapshotConfidence(submission != null ? submission.getSnapshotConfidence() : null)
            .cloneRelationship(submission != null ? submission.getCloneRelationship() : null)
            .cloneSimilarity(submission != null ? submission.getCloneSimilarity() : null)
            .cloneNotes(submission != null ? submission.getCloneNotes() : null)
            .bugSeverity(submission != null ? submission.getBugSeverity() : null)
            .bugReproducible(submission != null ? submission.getBugReproducible() : null)
            .bugCategory(submission != null ? submission.getBugCategory() : null)
            .bugNotes(submission != null ? submission.getBugNotes() : null)
            .solidViolatedPrinciple(submission != null ? submission.getSolidViolatedPrinciple() : null)
            .solidViolationSeverity(submission != null ? submission.getSolidViolationSeverity() : null)
            .solidExplanation(submission != null ? submission.getSolidExplanation() : null)
            .solidSuggestedFix(submission != null ? submission.getSolidSuggestedFix() : null)
            .annotationCount(resolveAnnotationCount(assignment, submission))
            .reviewerStatus(submission != null && submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : null)
            .reviewerQualityScore(submission != null ? submission.getReviewerQualityScore() : null)
            .reviewerNotes(submission != null ? submission.getReviewerNotes() : null)
            .reviewedById(submission != null && submission.getReviewedBy() != null ? submission.getReviewedBy().getId() : null)
            .reviewedByName(submission != null && submission.getReviewedBy() != null ? submission.getReviewedBy().getFullName() : null)
            .reviewedAt(submission != null ? submission.getReviewedAt() : null)
            .build();
    }

    private SubmissionReviewDetailDTO buildSubmissionDetailResponse(
        ParticipantTaskAssignment assignment,
        boolean anonymizeParticipant
    ) {
        EvaluationTask task = assignment.getEvaluationTask();
        SubmissionDTO submissionDTO = submissionRepository.findByAssignmentId(assignment.getId())
            .map(this::convertToDTO)
            .orElse(null);

        List<ArtifactDTO> artifacts = artifactMappingService.getArtifactsForTask(task.getId());
        List<CriteriaItemDTO> criteria = task.getTaskType() != null
            ? getCriteriaForTaskType(task.getTaskType().getId())
            : Collections.emptyList();
        List<ScoreEntryDTO> scores = scoreEntryRepository.findByAssignmentId(assignment.getId()).stream()
            .map(this::convertScoreToDTO)
            .toList();
        List<AnnotationDTO> annotations = annotationRepository.findByAssignmentId(assignment.getId()).stream()
            .map(this::convertAnnotationToDTO)
            .toList();

        AssignmentDTO assignmentDTO = convertAssignmentToDTO(assignment);
        String participantEmail = assignment.getParticipant().getEmail();
        String participantUsername = assignment.getParticipant().getUsername();

        if (anonymizeParticipant) {
            String alias = buildReviewerParticipantAlias(assignment.getParticipant().getId());
            assignmentDTO.setParticipantName(alias);
            assignmentDTO.setParticipantEmail(null);
            assignmentDTO.setParticipantUsername(null);
            participantEmail = null;
            participantUsername = null;
        }

        List<ViewerArtifactDTO> viewerArtifacts = buildViewerArtifacts(task, artifacts);

        return SubmissionReviewDetailDTO.builder()
            .assignment(assignmentDTO)
            .task(convertTaskToDTO(task))
            .taskType(task.getTaskType() != null ? convertTaskTypeToDTO(task.getTaskType()) : null)
            .artifacts(artifacts)
            .criteria(criteria)
            .artifactReferences(task.getArtifacts())
            .dynamicCriteria(task.getCriteria())
            .viewerArtifacts(viewerArtifacts)
            .scores(scores)
            .annotations(annotations)
            .submission(submissionDTO)
            .studyId(task.getStudy() != null ? task.getStudy().getId() : null)
            .studyTitle(task.getStudy() != null ? task.getStudy().getTitle() : null)
            .participantEmail(participantEmail)
            .participantUsername(participantUsername)
            .snapshotDecision(submissionDTO != null ? submissionDTO.getSnapshotDecision() : null)
            .snapshotExplanation(submissionDTO != null ? submissionDTO.getSnapshotExplanation() : null)
            .snapshotConfidence(submissionDTO != null ? submissionDTO.getSnapshotConfidence() : null)
            .cloneRelationship(submissionDTO != null ? submissionDTO.getCloneRelationship() : null)
            .cloneSimilarity(submissionDTO != null ? submissionDTO.getCloneSimilarity() : null)
            .cloneNotes(submissionDTO != null ? submissionDTO.getCloneNotes() : null)
            .bugSeverity(submissionDTO != null ? submissionDTO.getBugSeverity() : null)
            .bugReproducible(submissionDTO != null ? submissionDTO.getBugReproducible() : null)
            .bugCategory(submissionDTO != null ? submissionDTO.getBugCategory() : null)
            .bugNotes(submissionDTO != null ? submissionDTO.getBugNotes() : null)
            .solidViolatedPrinciple(submissionDTO != null ? submissionDTO.getSolidViolatedPrinciple() : null)
            .solidViolationSeverity(submissionDTO != null ? submissionDTO.getSolidViolationSeverity() : null)
            .solidExplanation(submissionDTO != null ? submissionDTO.getSolidExplanation() : null)
            .solidSuggestedFix(submissionDTO != null ? submissionDTO.getSolidSuggestedFix() : null)
            .reviewerStatus(submissionDTO != null ? submissionDTO.getReviewerStatus() : null)
            .reviewerNotes(submissionDTO != null ? submissionDTO.getReviewerNotes() : null)
            .reviewerQualityScore(submissionDTO != null ? submissionDTO.getReviewerQualityScore() : null)
            .reviewedById(submissionDTO != null ? submissionDTO.getReviewedById() : null)
            .reviewedByName(submissionDTO != null ? submissionDTO.getReviewedByName() : null)
            .reviewedAt(submissionDTO != null ? submissionDTO.getReviewedAt() : null)
            .build();
    }

    private String buildReviewerParticipantAlias(Long participantId) {
        return "ReviewerParticipant #" + participantId;
    }

    private EvaluationTask getOwnedTask(Long taskId, Long researcherId) {
        EvaluationTask task = evaluationTaskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Evaluation task not found"));

        if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(researcherId)) {
            throw new IllegalStateException("You are not authorized to view submissions for this task");
        }

        return task;
    }

    private AssignmentDTO convertAssignmentToDTO(ParticipantTaskAssignment assignment) {
        EvaluationTask task = assignment.getEvaluationTask();
        return AssignmentDTO.builder()
            .id(assignment.getId())
            .evaluationTaskId(task.getId())
            .taskTitle(task.getTitle())
            .taskDescription(task.getDescription())
            .participantId(assignment.getParticipant().getId())
            .participantName(assignment.getParticipant().getFullName())
            .participantEmail(assignment.getParticipant().getEmail())
            .participantUsername(assignment.getParticipant().getUsername())
            .status(assignment.getStatus().name())
            .assignedAt(assignment.getAssignedAt())
            .dueDate(assignment.getDueDate())
            .startedAt(assignment.getStartedAt())
            .submittedAt(assignment.getSubmittedAt())
            .taskTypeName(task.getTaskType() != null ? task.getTaskType().getName() : null)
            .layoutMode(task.getTaskType() != null ? task.getTaskType().getLayoutMode().name() : null)
            .comparisonMode(task.getTaskType() != null ? task.getTaskType().getComparisonMode().name() : null)
            .build();
    }

    private EvaluationTaskDTO convertTaskToDTO(EvaluationTask task) {
        return EvaluationTaskDTO.builder()
            .id(task.getId())
            .taskTypeId(task.getTaskType() != null ? task.getTaskType().getId() : null)
            .studyId(task.getStudy() != null ? task.getStudy().getId() : null)
            .title(task.getTitle())
            .description(task.getDescription())
            .instructions(task.getInstructions())
            .status(task.getStatus().name())
            .dueDate(task.getDueDate())
            .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
            .createdByName(task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : null)
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .allowHighlight(task.getAllowHighlight())
            .allowAnnotation(task.getAllowAnnotation())
            .allowTagging(task.getAllowTagging())
            .layoutMode(task.getLayoutMode() != null ? task.getLayoutMode().name() : null)
            .cloneOriginalCodeContent(task.getCloneOriginalCodeContent())
            .cloneCloneCodeContent(task.getCloneCloneCodeContent())
            .bugReportJson(task.getBugReportJson())
            .solidJson(task.getSolidJson())
            .blindedMode(task.getBlindedMode())
            .blindedOrder(task.getBlindedOrder())
            .artifacts(task.getArtifacts())
            .criteria(task.getCriteria())
            .build();
    }

    private TaskTypeDTO convertTaskTypeToDTO(TaskType taskType) {
        if (taskType == null) {
            return null;
        }
        return TaskTypeDTO.builder()
            .id(taskType.getId())
            .name(taskType.getName())
            .artifactType(taskType.getArtifactType().name())
            .layoutMode(taskType.getLayoutMode().name())
            .comparisonMode(taskType.getComparisonMode().name())
            .description(taskType.getDescription())
            .createdById(taskType.getCreatedBy() != null ? taskType.getCreatedBy().getId() : null)
            .createdByName(taskType.getCreatedBy() != null ? taskType.getCreatedBy().getFullName() : null)
            .createdAt(taskType.getCreatedAt())
            .build();
    }

    private List<CriteriaItemDTO> getCriteriaForTaskType(Long taskTypeId) {
        if (taskTypeId == null) {
            return Collections.emptyList();
        }
        return criteriaRepository.findByTaskTypeId(taskTypeId).stream()
            .map(this::convertCriteriaToDTO)
            .toList();
    }

    private CriteriaItemDTO convertCriteriaToDTO(CriteriaItem item) {
        return CriteriaItemDTO.builder()
            .id(item.getId())
            .criteriaSetId(item.getCriteriaSet().getId())
            .name(item.getName())
            .criterionType(item.getCriterionType().name())
            .scaleType(item.getScaleType() != null ? item.getScaleType().name() : null)
            .isRequired(item.getIsRequired())
            .weight(item.getWeight())
            .options(item.getOptions())
            .displayOrder(item.getDisplayOrder())
            .build();
    }

    private List<ViewerArtifactDTO> buildViewerArtifacts(EvaluationTask task, List<ArtifactDTO> legacyArtifacts) {
        if (task.getArtifacts() != null && !task.getArtifacts().isEmpty()) {
            List<ArtifactReference> references = new ArrayList<>(task.getArtifacts());
            references.sort(Comparator.comparing(ref -> ref.getDisplayOrder() != null ? ref.getDisplayOrder() : 0));

            if (Boolean.TRUE.equals(task.getBlindedMode()) && task.getBlindedOrder() != null && !task.getBlindedOrder().isEmpty()) {
                List<ArtifactReference> reordered = new ArrayList<>();
                for (Integer displayOrder : task.getBlindedOrder()) {
                    references.stream()
                        .filter(ref -> Objects.equals(ref.getDisplayOrder(), displayOrder))
                        .findFirst()
                        .ifPresent(reordered::add);
                }
                if (!reordered.isEmpty()) {
                    references = reordered;
                }
            }

            List<ArtifactReference> finalReferences = references;
            return IntStream.range(0, finalReferences.size())
                .mapToObj(index -> buildReferenceViewerArtifact(task, finalReferences.get(index), index))
                .filter(Objects::nonNull)
                .toList();
        }

        if (legacyArtifacts == null || legacyArtifacts.isEmpty()) {
            return List.of();
        }

        List<ArtifactDTO> orderedLegacy = new ArrayList<>(legacyArtifacts);
        orderedLegacy.sort(Comparator.comparing(dto -> dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0));

        List<ArtifactDTO> finalOrderedLegacy = orderedLegacy;
        return IntStream.range(0, finalOrderedLegacy.size())
            .mapToObj(index -> {
                ArtifactDTO artifact = finalOrderedLegacy.get(index);
                String displayName = artifact.getDisplayLabel();
                if (displayName == null || displayName.isBlank()) {
                    displayName = "Artifact " + (char) ('A' + index);
                }
                return ViewerArtifactDTO.builder()
                    .artifactId(artifact.getId())
                    .displayName(displayName)
                    .displayOrder(index + 1)
                    .mimeType("application/octet-stream")
                    .url(artifact.getId() != null ? "/api/artifacts/" + artifact.getId() + "/download" : null)
                    .build();
            })
            .toList();
    }

    private ViewerArtifactDTO buildReferenceViewerArtifact(EvaluationTask task, ArtifactReference reference, int index) {
        String label = reference.getDisplayLabel();
        if (Boolean.TRUE.equals(task.getBlindedMode())) {
            label = "Artifact " + (char) ('A' + index);
        } else if (label == null || label.isBlank()) {
            label = "Artifact " + (index + 1);
        }

        Artifact artifact = null;
        if (reference.getArtifactId() != null) {
            artifact = storedArtifactRepository.findById(reference.getArtifactId()).orElse(null);
        }

        return ViewerArtifactDTO.builder()
            .artifactId(reference.getArtifactId())
            .displayName(label)
            .displayOrder(reference.getDisplayOrder())
            .mimeType(artifact != null ? artifact.getContentType() : "application/octet-stream")
            .url(reference.getArtifactId() != null ? "/api/artifacts/" + reference.getArtifactId() + "/download" : null)
            .build();
    }

    private ScoreEntryDTO convertScoreToDTO(ScoreEntry entry) {
        return ScoreEntryDTO.builder()
            .id(entry.getId())
            .assignmentId(entry.getAssignment().getId())
            .criteriaItemId(entry.getCriteriaItem().getId())
            .value(entry.getValue())
            .notes(entry.getNotes())
            .createdAt(entry.getCreatedAt())
            .updatedAt(entry.getUpdatedAt())
            .build();
    }

    private AnnotationDTO convertAnnotationToDTO(EvaluationAnnotation annotation) {
        return AnnotationDTO.builder()
            .id(annotation.getId())
            .assignmentId(annotation.getAssignment().getId())
            .artifactId(annotation.getArtifactId())
            .panelNumber(annotation.getPanelNumber())
            .annotationType(annotation.getAnnotationType().name())
            .content(annotation.getContent())
            .startLine(annotation.getStartLine())
            .endLine(annotation.getEndLine())
            .startOffset(annotation.getStartOffset())
            .endOffset(annotation.getEndOffset())
            .color(annotation.getColor())
            .tags(annotation.getTags())
            .createdAt(annotation.getCreatedAt())
            .updatedAt(annotation.getUpdatedAt())
            .build();
    }

    private List<Map<String, Object>> buildSnapshotAnnotationSummaries(JsonNode annotationsSnapshot) {
        ArrayNode snapshotArray = extractAnnotationArray(annotationsSnapshot);
        if (snapshotArray == null) {
            return Collections.emptyList();
        }
        List<Map<String, Object>> summaries = new ArrayList<>();
        for (JsonNode node : snapshotArray) {
            Map<String, Object> map = new LinkedHashMap<>();
            String type = node.path("annotationType").asText(
                node.path("type").asText(node.has("region") ? "REGION" : "HIGHLIGHT")
            );
            map.put("type", type);
            if (node.hasNonNull("panelNumber")) {
                map.put("panelNumber", node.get("panelNumber").asInt());
            }
            map.put("content", node.path("text").asText(node.path("content").asText("")));
            if (node.has("artifactId")) {
                map.put("artifactId", node.get("artifactId").asText());
            }
            if (node.has("tags") && node.get("tags").isArray()) {
                map.put("tags", objectMapper.convertValue(node.get("tags"), List.class));
            }
            if (node.has("range")) {
                map.put("range", node.get("range"));
            }
            if (node.has("region")) {
                map.put("region", node.get("region"));
            }
            summaries.add(map);
        }
        return summaries;
    }

    private ArrayNode extractAnnotationArray(JsonNode annotationsSnapshot) {
        if (annotationsSnapshot == null) {
            return null;
        }
        if (annotationsSnapshot.isArray()) {
            return (ArrayNode) annotationsSnapshot;
        }
        if (annotationsSnapshot.has("annotations") && annotationsSnapshot.get("annotations").isArray()) {
            return (ArrayNode) annotationsSnapshot.get("annotations");
        }
        return null;
    }

    private int resolveAnnotationCount(ParticipantTaskAssignment assignment, EvaluationSubmission submission) {
        int persisted = (int) annotationRepository.countByAssignmentId(assignment.getId());
        return persisted + getSnapshotAnnotationCount(submission);
    }

    private int getSnapshotAnnotationCount(EvaluationSubmission submission) {
        if (submission == null) {
            return 0;
        }
        ArrayNode snapshotArray = extractAnnotationArray(submission.getAnnotationsSnapshot());
        return snapshotArray != null ? snapshotArray.size() : 0;
    }

    private String buildExportFileName(Long taskId, String extension) {
        return "evaluation-task-" + taskId + "-submissions." + extension;
    }

    private String convertRowsToCsv(List<Map<String, Object>> rows) throws Exception {
        String[] headers = {
            "taskId", "taskTitle", "studyId", "studyTitle", "artifactType",
            "assignmentId", "participantId", "participantName", "participantEmail",
            "participantUsername", "status", "submitted",
            "assignedAt", "startedAt", "submittedAt",
            "timeSpentSeconds", "criteriaResponses", "annotationCount", "annotations"
        };

        StringBuilder builder = new StringBuilder();
        builder.append(String.join(",", headers)).append("\n");

        for (Map<String, Object> row : rows) {
            for (int i = 0; i < headers.length; i++) {
                String key = headers[i];
                Object value = row.get(key);
                if ("annotations".equals(key) || "criteriaResponses".equals(key)) {
                    value = objectMapper.writeValueAsString(row.get(key));
                }
                builder.append(escapeCsv(value));
                if (i < headers.length - 1) {
                    builder.append(",");
                }
            }
            builder.append("\n");
        }

        return builder.toString();
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String stringValue = value.toString();
        if (stringValue.contains(",") || stringValue.contains("\"") || stringValue.contains("\n")) {
            stringValue = stringValue.replace("\"", "\"\"");
            return "\"" + stringValue + "\"";
        }
        return stringValue;
    }

    private byte[] exportSubmissionsAsPDF(EvaluationTask task, List<Map<String, Object>> rows) throws IOException {
        try (PDDocument document = new PDDocument()) {
            float margin = 50;
            float lineHeight = 20;
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String generatedOn = LocalDateTime.now().format(dateFormatter);
            
            String taskTitle = task.getTitle();
            String studyTitle = task.getStudy() != null ? task.getStudy().getTitle() : "N/A";

            // Create a page for each participant
            for (Map<String, Object> row : rows) {
                PDPage page = new PDPage();
                document.addPage(page);
                PDPageContentStream contentStream = new PDPageContentStream(document, page);

                float currentY = 750;

                // Header section (same on every page)
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Task Submissions Report");
                contentStream.endText();
                currentY -= 30;

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Task: " + taskTitle);
                contentStream.endText();
                currentY -= 20;

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Study: " + studyTitle);
                contentStream.endText();
                currentY -= 20;

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Generated on: " + generatedOn);
                contentStream.endText();
                currentY -= 30;

                // Draw divider line
                contentStream.moveTo(margin, currentY);
                contentStream.lineTo(550, currentY);
                contentStream.stroke();
                currentY -= 20;

                // Participant Information Section
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Participant Information");
                contentStream.endText();
                currentY -= 25;

                contentStream.setFont(PDType1Font.HELVETICA, 10);
                String participantName = String.valueOf(row.getOrDefault("participantName", "N/A"));
                String participantEmail = String.valueOf(row.getOrDefault("participantEmail", "N/A"));
                String status = String.valueOf(row.getOrDefault("status", "N/A"));
                String submitted = row.getOrDefault("submitted", false).toString();
                LocalDateTime submittedAt = (LocalDateTime) row.get("submittedAt");
                String submittedDateTime = submittedAt != null 
                    ? submittedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    : "—";
                String timeSpent = row.get("timeSpentSeconds") != null
                    ? formatDurationSeconds((Integer) row.get("timeSpentSeconds"))
                    : "—";
                String annotationCount = String.valueOf(row.getOrDefault("annotationCount", 0));

                // Reviewer evaluation info
                String reviewerStatus = String.valueOf(row.getOrDefault("reviewerStatus", "—"));
                String reviewerQualityScore = row.get("reviewerQualityScore") != null
                    ? String.valueOf(row.get("reviewerQualityScore"))
                    : "—";
                String reviewerNotes = String.valueOf(row.getOrDefault("reviewerNotes", "—"));
                String reviewedByName = String.valueOf(row.getOrDefault("reviewedByName", "—"));
                LocalDateTime reviewedAt = (LocalDateTime) row.get("reviewedAt");
                String reviewedAtStr = reviewedAt != null
                    ? reviewedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    : "—";

                // Line 1: Participant and Email
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Participant: " + participantName + " | Email: " + participantEmail);
                contentStream.endText();
                currentY -= 18;

                // Line 2: Status and Submitted with date/time
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Status: " + status + " | Submitted: " + submitted);
                if (submittedAt != null) {
                    contentStream.showText(" (" + submittedDateTime + ")");
                }
                contentStream.endText();
                currentY -= 18;

                // Line 3: Reviewer evaluation
                boolean hasReviewerInfo = (reviewerStatus != null && !"null".equals(reviewerStatus) && !"—".equals(reviewerStatus)) ||
                                         (reviewerQualityScore != null && !"null".equals(reviewerQualityScore) && !"—".equals(reviewerQualityScore)) ||
                                         (reviewedByName != null && !"null".equals(reviewedByName) && !"—".equals(reviewedByName));
                
                if (hasReviewerInfo) {
                    StringBuilder reviewerInfoBuilder = new StringBuilder();
                    if (reviewerStatus != null && !"null".equals(reviewerStatus) && !"—".equals(reviewerStatus)) {
                        reviewerInfoBuilder.append("Reviewer Status: ").append(reviewerStatus);
                    }
                    if (reviewerQualityScore != null && !"null".equals(reviewerQualityScore) && !"—".equals(reviewerQualityScore)) {
                        if (reviewerInfoBuilder.length() > 0) reviewerInfoBuilder.append(" | ");
                        reviewerInfoBuilder.append("Quality Score: ").append(reviewerQualityScore).append("/5");
                    }
                    if (reviewedByName != null && !"null".equals(reviewedByName) && !"—".equals(reviewedByName)) {
                        if (reviewerInfoBuilder.length() > 0) reviewerInfoBuilder.append(" | ");
                        reviewerInfoBuilder.append("Reviewed by: ").append(reviewedByName);
                    }
                    if (reviewedAt != null) {
                        reviewerInfoBuilder.append(" (").append(reviewedAtStr).append(")");
                    }
                    
                    List<String> reviewerInfoLines = wrapText(reviewerInfoBuilder.toString(), 90);
                    for (String line : reviewerInfoLines) {
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, currentY);
                        contentStream.showText(line);
                        contentStream.endText();
                        currentY -= 15;
                    }
                    
                    if (reviewerNotes != null && !reviewerNotes.isEmpty() && !"null".equals(reviewerNotes) && !"—".equals(reviewerNotes)) {
                        List<String> notesLines = wrapText("Reviewer Notes: " + reviewerNotes, 85);
                        for (String line : notesLines) {
                            contentStream.beginText();
                            contentStream.newLineAtOffset(margin + 20, currentY);
                            contentStream.showText(line);
                            contentStream.endText();
                            currentY -= 15;
                        }
                    }
                } else {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText("Reviewer Evaluation: Not reviewed yet");
                    contentStream.endText();
                    currentY -= 18;
                }

                // Line 4: Time Spent and Annotations
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Time Spent: " + timeSpent + " | Annotations: " + annotationCount);
                contentStream.endText();
                currentY -= 25;

                // Criteria Answers Section
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(margin, currentY);
                contentStream.showText("Criteria Answers");
                contentStream.endText();
                currentY -= 25;

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> criteriaResponses = (List<Map<String, Object>>) row.get("criteriaResponses");
                
                if (criteriaResponses == null || criteriaResponses.isEmpty()) {
                    contentStream.setFont(PDType1Font.HELVETICA, 10);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, currentY);
                    contentStream.showText("No criteria responses available.");
                    contentStream.endText();
                } else {
                    contentStream.setFont(PDType1Font.HELVETICA, 10);
                    boolean isSideBySide = task.getLayoutMode() == EvaluationTask.LayoutMode.SIDE_BY_SIDE;
                    boolean isThreeWay = task.getLayoutMode() == EvaluationTask.LayoutMode.THREE_WAY;
                    boolean isSingle = task.getLayoutMode() == EvaluationTask.LayoutMode.SINGLE;
                    
                    for (Map<String, Object> response : criteriaResponses) {
                        String criteriaName = String.valueOf(response.getOrDefault("criteriaName", "Unknown"));
                        
                        // Question (criteria name)
                        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, currentY);
                        contentStream.showText("Q: " + criteriaName);
                        contentStream.endText();
                        currentY -= 18;

                        // Check if this is single mode with single responses
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> singleResponses = (List<Map<String, Object>>) response.get("singleResponses");
                        
                        // Check if this is three-way mode with triplet responses
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> tripletResponses = (List<Map<String, Object>>) response.get("tripletResponses");
                        
                        // Check if this is side-by-side mode with pair responses
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> pairResponses = (List<Map<String, Object>>) response.get("pairResponses");
                        
                        if (singleResponses != null && !singleResponses.isEmpty()) {
                            // Single mode: show each artifact's answer
                            contentStream.setFont(PDType1Font.HELVETICA, 10);
                            for (Map<String, Object> singleResponse : singleResponses) {
                                Integer artifactIndex = (Integer) singleResponse.get("artifactIndex");
                                Object valueObj = singleResponse.get("value");
                                String value = valueObj != null ? valueObj.toString() : "—";
                                
                                String singleAnswerText = "Artifact " + artifactIndex + ": " + value;
                                List<String> answerLines = wrapText(singleAnswerText, 90);
                                for (String line : answerLines) {
                                    contentStream.beginText();
                                    contentStream.newLineAtOffset(margin + 20, currentY);
                                    contentStream.showText(line);
                                    contentStream.endText();
                                    currentY -= 15;
                                }
                            }
                        } else if (tripletResponses != null && !tripletResponses.isEmpty()) {
                            // Three-way mode: show each triplet's answer
                            contentStream.setFont(PDType1Font.HELVETICA, 10);
                            for (Map<String, Object> tripletResponse : tripletResponses) {
                                Integer tripletIndex = (Integer) tripletResponse.get("tripletIndex");
                                Object valueObj = tripletResponse.get("value");
                                String value = valueObj != null ? valueObj.toString() : "—";
                                
                                String tripletAnswerText = "Triplet " + tripletIndex + ": " + value;
                                List<String> answerLines = wrapText(tripletAnswerText, 90);
                                for (String line : answerLines) {
                                    contentStream.beginText();
                                    contentStream.newLineAtOffset(margin + 20, currentY);
                                    contentStream.showText(line);
                                    contentStream.endText();
                                    currentY -= 15;
                                }
                            }
                        } else if (pairResponses != null && !pairResponses.isEmpty()) {
                            // Side-by-side mode: show each pair's answer
                            contentStream.setFont(PDType1Font.HELVETICA, 10);
                            for (Map<String, Object> pairResponse : pairResponses) {
                                Integer pairIndex = (Integer) pairResponse.get("pairIndex");
                                Object valueObj = pairResponse.get("value");
                                String value = valueObj != null ? valueObj.toString() : "—";
                                
                                String pairAnswerText = "Pair " + pairIndex + ": " + value;
                                List<String> answerLines = wrapText(pairAnswerText, 90);
                                for (String line : answerLines) {
                                    contentStream.beginText();
                                    contentStream.newLineAtOffset(margin + 20, currentY);
                                    contentStream.showText(line);
                                    contentStream.endText();
                                    currentY -= 15;
                                }
                            }
                        } else {
                            // Normal mode: single answer
                            Object valueObj = response.get("value");
                            String value = valueObj != null ? valueObj.toString() : "—";
                            
                            // Answer (value)
                            contentStream.setFont(PDType1Font.HELVETICA, 10);
                            List<String> answerLines = wrapText("A: " + value, 90);
                            for (String line : answerLines) {
                                contentStream.beginText();
                                contentStream.newLineAtOffset(margin + 20, currentY);
                                contentStream.showText(line);
                                contentStream.endText();
                                currentY -= 15;
                            }
                        }
                        
                        currentY -= 10; // Space between questions
                        
                        // Check if we need a new page (but we're already on a new page per participant)
                        if (currentY < 100) {
                            // Shouldn't happen since each participant gets their own page
                            break;
                        }
                    }
                }

                contentStream.close();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] exportSubmissionsAsExcel(EvaluationTask task, List<Map<String, Object>> rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Submissions");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create date style
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd hh:mm"));

            // Get all unique criteria names to create dynamic columns
            // For side-by-side mode: "Criterion Name (Pair 1)", "Criterion Name (Pair 2)", etc.
            // For three-way mode: "Criterion Name (Triplet 1)", "Criterion Name (Triplet 2)", etc.
            // For single mode: "Criterion Name (Artifact 1)", "Criterion Name (Artifact 2)", etc.
            Set<String> allCriteriaNames = new LinkedHashSet<>();
            boolean isSideBySide = task.getLayoutMode() == EvaluationTask.LayoutMode.SIDE_BY_SIDE;
            boolean isThreeWay = task.getLayoutMode() == EvaluationTask.LayoutMode.THREE_WAY;
            boolean isSingle = task.getLayoutMode() == EvaluationTask.LayoutMode.SINGLE;
            int maxPairCount = 0;
            int maxTripletCount = 0;
            int maxArtifactCount = 0;
            
            for (Map<String, Object> row : rows) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> criteriaResponses = (List<Map<String, Object>>) row.get("criteriaResponses");
                if (criteriaResponses != null) {
                    for (Map<String, Object> response : criteriaResponses) {
                        String criteriaName = String.valueOf(response.getOrDefault("criteriaName", ""));
                        if (!criteriaName.isEmpty() && !"null".equals(criteriaName)) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> singleResponses = (List<Map<String, Object>>) response.get("singleResponses");
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> tripletResponses = (List<Map<String, Object>>) response.get("tripletResponses");
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> pairResponses = (List<Map<String, Object>>) response.get("pairResponses");
                            
                            if (isSingle && singleResponses != null && !singleResponses.isEmpty()) {
                                // For single mode, add columns for each artifact
                                for (Map<String, Object> singleResponse : singleResponses) {
                                    Integer artifactIndex = (Integer) singleResponse.get("artifactIndex");
                                    if (artifactIndex != null) {
                                        allCriteriaNames.add(criteriaName + " (Artifact " + artifactIndex + ")");
                                        maxArtifactCount = Math.max(maxArtifactCount, artifactIndex);
                                    }
                                }
                            } else if (isThreeWay && tripletResponses != null && !tripletResponses.isEmpty()) {
                                // For three-way, add columns for each triplet
                                for (Map<String, Object> tripletResponse : tripletResponses) {
                                    Integer tripletIndex = (Integer) tripletResponse.get("tripletIndex");
                                    if (tripletIndex != null) {
                                        allCriteriaNames.add(criteriaName + " (Triplet " + tripletIndex + ")");
                                        maxTripletCount = Math.max(maxTripletCount, tripletIndex);
                                    }
                                }
                            } else if (isSideBySide && pairResponses != null && !pairResponses.isEmpty()) {
                                // For side-by-side, add columns for each pair
                                for (Map<String, Object> pairResponse : pairResponses) {
                                    Integer pairIndex = (Integer) pairResponse.get("pairIndex");
                                    if (pairIndex != null) {
                                        allCriteriaNames.add(criteriaName + " (Pair " + pairIndex + ")");
                                        maxPairCount = Math.max(maxPairCount, pairIndex);
                                    }
                                }
                            } else {
                                // Normal mode
                                allCriteriaNames.add(criteriaName);
                            }
                        }
                    }
                }
            }

            int rowNum = 0;
            Row headerRow = sheet.createRow(rowNum++);
            List<String> headerList = new ArrayList<>();
            headerList.add("Participant Name");
            headerList.add("Participant Email");
            headerList.add("Status");
            headerList.add("Submitted");
            headerList.add("Time Spent (seconds)");
            headerList.add("Time Spent (formatted)");
            headerList.add("Submitted At");
            headerList.addAll(allCriteriaNames);
            headerList.add("Annotation Count");
            headerList.add("Task Title");
            headerList.add("Study Title");
            
            String[] headers = headerList.toArray(new String[0]);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            for (Map<String, Object> row : rows) {
                Row dataRow = sheet.createRow(rowNum++);
                int colNum = 0;

                dataRow.createCell(colNum++).setCellValue(String.valueOf(row.getOrDefault("participantName", "")));
                dataRow.createCell(colNum++).setCellValue(String.valueOf(row.getOrDefault("participantEmail", "")));
                dataRow.createCell(colNum++).setCellValue(String.valueOf(row.getOrDefault("status", "")));
                dataRow.createCell(colNum++).setCellValue(row.getOrDefault("submitted", false).toString());
                
                Integer timeSpent = (Integer) row.get("timeSpentSeconds");
                if (timeSpent != null) {
                    dataRow.createCell(colNum++).setCellValue(timeSpent);
                    dataRow.createCell(colNum++).setCellValue(formatDurationSeconds(timeSpent));
                } else {
                    dataRow.createCell(colNum++).setCellValue("");
                    dataRow.createCell(colNum++).setCellValue("—");
                }

                LocalDateTime submittedAt = (LocalDateTime) row.get("submittedAt");
                if (submittedAt != null) {
                    Cell dateCell = dataRow.createCell(colNum++);
                    dateCell.setCellValue(submittedAt);
                    dateCell.setCellStyle(dateStyle);
                } else {
                    dataRow.createCell(colNum++).setCellValue("—");
                }

                // Criteria Responses - create a map for quick lookup
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> criteriaResponses = (List<Map<String, Object>>) row.get("criteriaResponses");
                Map<String, String> criteriaMap = new LinkedHashMap<>();
                if (criteriaResponses != null) {
                    for (Map<String, Object> response : criteriaResponses) {
                        String criteriaName = String.valueOf(response.getOrDefault("criteriaName", ""));
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> singleResponses = (List<Map<String, Object>>) response.get("singleResponses");
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> tripletResponses = (List<Map<String, Object>>) response.get("tripletResponses");
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> pairResponses = (List<Map<String, Object>>) response.get("pairResponses");
                        
                        if (isSingle && singleResponses != null && !singleResponses.isEmpty()) {
                            // For single mode, map each artifact's answer
                            for (Map<String, Object> singleResponse : singleResponses) {
                                Integer artifactIndex = (Integer) singleResponse.get("artifactIndex");
                                Object value = singleResponse.get("value");
                                String valueStr = value != null ? value.toString() : "";
                                if (artifactIndex != null) {
                                    criteriaMap.put(criteriaName + " (Artifact " + artifactIndex + ")", valueStr);
                                }
                            }
                        } else if (isThreeWay && tripletResponses != null && !tripletResponses.isEmpty()) {
                            // For three-way mode, map each triplet's answer
                            for (Map<String, Object> tripletResponse : tripletResponses) {
                                Integer tripletIndex = (Integer) tripletResponse.get("tripletIndex");
                                Object value = tripletResponse.get("value");
                                String valueStr = value != null ? value.toString() : "";
                                if (tripletIndex != null) {
                                    criteriaMap.put(criteriaName + " (Triplet " + tripletIndex + ")", valueStr);
                                }
                            }
                        } else if (isSideBySide && pairResponses != null && !pairResponses.isEmpty()) {
                            // For side-by-side mode, map each pair's answer
                            for (Map<String, Object> pairResponse : pairResponses) {
                                Integer pairIndex = (Integer) pairResponse.get("pairIndex");
                                Object value = pairResponse.get("value");
                                String valueStr = value != null ? value.toString() : "";
                                if (pairIndex != null) {
                                    criteriaMap.put(criteriaName + " (Pair " + pairIndex + ")", valueStr);
                                }
                            }
                        } else {
                            // Normal mode
                            Object value = response.get("value");
                            String valueStr = value != null ? value.toString() : "";
                            criteriaMap.put(criteriaName, valueStr);
                        }
                    }
                }

                // Add criteria values in the same order as headers
                for (String criteriaName : allCriteriaNames) {
                    String value = criteriaMap.getOrDefault(criteriaName, "");
                    dataRow.createCell(colNum++).setCellValue(value);
                }

                dataRow.createCell(colNum++).setCellValue(((Number) row.getOrDefault("annotationCount", 0)).intValue());
                dataRow.createCell(colNum++).setCellValue(String.valueOf(row.getOrDefault("taskTitle", "")));
                dataRow.createCell(colNum++).setCellValue(String.valueOf(row.getOrDefault("studyTitle", "")));
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private String truncateString(String str, int maxLength) {
        if (str == null) return "";
        return str.length() > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
    }

    private String formatDurationSeconds(int seconds) {
        if (seconds < 60) {
            return seconds + "s";
        }
        int minutes = seconds / 60;
        int remainingSeconds = seconds % 60;
        return minutes + "m " + String.format("%02d", remainingSeconds) + "s";
    }

    private List<String> wrapText(String text, int maxCharsPerLine) {
        List<String> lines = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            lines.add("—");
            return lines;
        }
        
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();
        
        for (String word : words) {
            if (currentLine.length() + word.length() + 1 <= maxCharsPerLine) {
                if (currentLine.length() > 0) {
                    currentLine.append(" ");
                }
                currentLine.append(word);
            } else {
                if (currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder();
                }
                // If word is longer than maxCharsPerLine, split it
                if (word.length() > maxCharsPerLine) {
                    int start = 0;
                    while (start < word.length()) {
                        int end = Math.min(start + maxCharsPerLine, word.length());
                        lines.add(word.substring(start, end));
                        start = end;
                    }
                } else {
                    currentLine.append(word);
                }
            }
        }
        
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        
        return lines.isEmpty() ? List.of("—") : lines;
    }

    private String formatCriteriaResponsesForPDF(Map<String, Object> row) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> criteriaResponses = (List<Map<String, Object>>) row.get("criteriaResponses");
        if (criteriaResponses == null || criteriaResponses.isEmpty()) {
            return "—";
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < criteriaResponses.size(); i++) {
            Map<String, Object> response = criteriaResponses.get(i);
            String name = String.valueOf(response.getOrDefault("criteriaName", ""));
            Object valueObj = response.get("value");
            String value = valueObj != null ? valueObj.toString() : "";
            
            if (i > 0) {
                sb.append("; ");
            }
            sb.append(name).append(": ").append(value);
        }
        return sb.toString();
    }

    // Inner classes for validation
    public static class ValidationResult {
        private final List<String> errors = new ArrayList<>();

        public void addError(String error) {
            errors.add(error);
        }

        public boolean isValid() {
            return errors.isEmpty();
        }

        public List<String> getErrors() {
            return errors;
        }
    }

    private void validateDynamicCriteria(EvaluationTask task, SubmissionRequestDTO request, ValidationResult result) {
        Map<String, Object> answers = request.getAnswers() != null
            ? request.getAnswers()
            : Collections.emptyMap();

        // Check layout mode
        boolean isSideBySide = task.getLayoutMode() == EvaluationTask.LayoutMode.SIDE_BY_SIDE;
        boolean isThreeWay = task.getLayoutMode() == EvaluationTask.LayoutMode.THREE_WAY;
        boolean isSingle = task.getLayoutMode() == EvaluationTask.LayoutMode.SINGLE;
        
        // Count artifact pairs/triplets/singles
        int pairCount = 0;
        int tripletCount = 0;
        int singleCount = 0;
        if (isSideBySide && task.getArtifacts() != null) {
            pairCount = (task.getArtifacts().size() + 1) / 2; // Round up for odd numbers
        }
        if (isThreeWay && task.getArtifacts() != null) {
            tripletCount = (task.getArtifacts().size() + 2) / 3; // Round up for groups of 3
        }
        if (isSingle && task.getArtifacts() != null) {
            singleCount = task.getArtifacts().size(); // One artifact per page
        }

        for (EvaluationCriterionDefinition criterion : task.getCriteria()) {
            if (isSingle && singleCount > 0) {
                // For single mode, check each artifact
                for (int i = 0; i < singleCount; i++) {
                    String singleKey = "single_" + i + "_" + criterion.getId();
                    Object value = answers.get(singleKey);
                    
                    if (value != null) {
                        // Validate the value
                        if (value instanceof String str && str.isBlank()) {
                            if (criterion.isRequired()) {
                                result.addError("Required field not filled for artifact " + (i + 1) + ": " + criterion.getName());
                            }
                        } else if (value instanceof Iterable<?> iterable && !iterable.iterator().hasNext()) {
                            if (criterion.isRequired()) {
                                result.addError("Required field not filled for artifact " + (i + 1) + ": " + criterion.getName());
                            }
                        } else {
                            // Validate rating range if applicable
                            if ("rating".equalsIgnoreCase(criterion.getType()) && value instanceof Number number) {
                                double numericValue = number.doubleValue();
                                if (criterion.getScaleMin() != null && numericValue < criterion.getScaleMin()) {
                                    result.addError(criterion.getName() + " (artifact " + (i + 1) + ") must be >= " + criterion.getScaleMin());
                                }
                                if (criterion.getScaleMax() != null && numericValue > criterion.getScaleMax()) {
                                    result.addError(criterion.getName() + " (artifact " + (i + 1) + ") must be <= " + criterion.getScaleMax());
                                }
                            }
                        }
                    } else if (criterion.isRequired()) {
                        result.addError("Required field not filled for artifact " + (i + 1) + ": " + criterion.getName());
                    }
                }
            } else if (isThreeWay && tripletCount > 0) {
                // For three-way mode, check each triplet
                for (int i = 0; i < tripletCount; i++) {
                    String tripletKey = "triplet_" + i + "_" + criterion.getId();
                    Object value = answers.get(tripletKey);
                    
                    if (value != null) {
                        // Validate the value
                        if (value instanceof String str && str.isBlank()) {
                            if (criterion.isRequired()) {
                                result.addError("Required field not filled for triplet " + (i + 1) + ": " + criterion.getName());
                            }
                        } else if (value instanceof Iterable<?> iterable && !iterable.iterator().hasNext()) {
                            if (criterion.isRequired()) {
                                result.addError("Required field not filled for triplet " + (i + 1) + ": " + criterion.getName());
                            }
                        } else {
                            // Validate rating range if applicable
                            if ("rating".equalsIgnoreCase(criterion.getType()) && value instanceof Number number) {
                                double numericValue = number.doubleValue();
                                if (criterion.getScaleMin() != null && numericValue < criterion.getScaleMin()) {
                                    result.addError(criterion.getName() + " (triplet " + (i + 1) + ") must be >= " + criterion.getScaleMin());
                                }
                                if (criterion.getScaleMax() != null && numericValue > criterion.getScaleMax()) {
                                    result.addError(criterion.getName() + " (triplet " + (i + 1) + ") must be <= " + criterion.getScaleMax());
                                }
                            }
                        }
                    } else if (criterion.isRequired()) {
                        result.addError("Required field not filled for triplet " + (i + 1) + ": " + criterion.getName());
                    }
                }
            } else if (isSideBySide && pairCount > 0) {
                // For side-by-side mode, check each pair
                boolean foundAnyAnswer = false;
                for (int i = 0; i < pairCount; i++) {
                    String pairKey = "pair_" + i + "_" + criterion.getId();
                    Object value = answers.get(pairKey);
                    
                    if (value != null) {
                        foundAnyAnswer = true;
                        // Validate the value
                        if (value instanceof String str && str.isBlank()) {
                            if (criterion.isRequired()) {
                                result.addError("Required field not filled for pair " + (i + 1) + ": " + criterion.getName());
                            }
                        } else if (value instanceof Iterable<?> iterable && !iterable.iterator().hasNext()) {
                            if (criterion.isRequired()) {
                                result.addError("Required field not filled for pair " + (i + 1) + ": " + criterion.getName());
                            }
                        } else {
                            // Validate rating range if applicable
                            if ("rating".equalsIgnoreCase(criterion.getType()) && value instanceof Number number) {
                                double numericValue = number.doubleValue();
                                if (criterion.getScaleMin() != null && numericValue < criterion.getScaleMin()) {
                                    result.addError(criterion.getName() + " (pair " + (i + 1) + ") must be >= " + criterion.getScaleMin());
                                }
                                if (criterion.getScaleMax() != null && numericValue > criterion.getScaleMax()) {
                                    result.addError(criterion.getName() + " (pair " + (i + 1) + ") must be <= " + criterion.getScaleMax());
                                }
                            }
                        }
                    } else if (criterion.isRequired()) {
                        result.addError("Required field not filled for pair " + (i + 1) + ": " + criterion.getName());
                    }
                }
            } else {
                // Normal mode - check direct criterion ID
                Object value = answers.get(criterion.getId());
                if (criterion.isRequired()) {
                    if (value == null) {
                        result.addError("Required field not filled: " + criterion.getName());
                        continue;
                    }
                    if (value instanceof String str && str.isBlank()) {
                        result.addError("Required field not filled: " + criterion.getName());
                        continue;
                    }
                    if (value instanceof Iterable<?> iterable && !iterable.iterator().hasNext()) {
                        result.addError("Required field not filled: " + criterion.getName());
                        continue;
                    }
                }

                if (value == null) {
                    continue;
                }

                if ("rating".equalsIgnoreCase(criterion.getType()) && value instanceof Number number) {
                    double numericValue = number.doubleValue();
                    if (criterion.getScaleMin() != null && numericValue < criterion.getScaleMin()) {
                        result.addError(criterion.getName() + " must be >= " + criterion.getScaleMin());
                    }
                    if (criterion.getScaleMax() != null && numericValue > criterion.getScaleMax()) {
                        result.addError(criterion.getName() + " must be <= " + criterion.getScaleMax());
                    }
                }
            }
        }
    }

    public static class SubmissionValidationException extends RuntimeException {
        private final List<String> errors;

        public SubmissionValidationException(List<String> errors) {
            super("Submission validation failed: " + String.join(", ", errors));
            this.errors = errors;
        }

        public List<String> getErrors() {
            return errors;
        }
    }
}
