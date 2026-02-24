package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerEvaluationSummaryDTO {

    private Long assignmentId;
    private Long submissionId;
    private Long participantId;
    private String participantName;
    private Long taskId;
    private String taskTitle;
    private String artifactType;
    private LocalDateTime submittedAt;
    private Integer timeSpentSeconds;
    private String reviewerStatus;
    private Integer reviewerQualityScore;
    private String reviewerNotes;
    private Integer annotationCount;
    private String snapshotDecision;
    private String bugSeverity;
    private String cloneRelationship;
}
