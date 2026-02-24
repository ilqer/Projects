package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDTO {

    private Long id;
    private Long assignmentId;
    private LocalDateTime submittedAt;
    private Integer timeSpentSeconds;
    private Boolean isLocked;
    private JsonNode submissionData;
    private JsonNode answers;
    private JsonNode annotationsSnapshot;
    private JsonNode validationErrors;
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
    private String reviewerStatus;
    private String reviewerNotes;
    private Integer reviewerQualityScore;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByName;
}
