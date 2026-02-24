package com.artifactcomparator.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionReviewSummaryDTO {

    private Long assignmentId;
    private Long submissionId;
    private Long taskId;
    private String taskTitle;
    private Long studyId;
    private String studyTitle;
    private String artifactType;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private String participantUsername;
    private String status;
    private LocalDateTime assignedAt;
    private LocalDateTime startedAt;
    private LocalDateTime dueDate;
    private LocalDateTime submittedAt;
    private Integer timeSpentSeconds;
    private Boolean submitted;
    private String snapshotDecision;
    private String snapshotExplanation;
    private String snapshotConfidence;
    private String cloneRelationship;
    private Double cloneSimilarity;
    private String cloneNotes;
    private String bugSeverity;
    private String bugReproducible;
    private String bugCategory;
    private String bugNotes;
    private String solidViolatedPrinciple;
    private String solidViolationSeverity;
    private String solidExplanation;
    private String solidSuggestedFix;
    private Integer annotationCount;
    private String reviewerStatus;
    private Integer reviewerQualityScore;
    private String reviewerNotes;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
}
