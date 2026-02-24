package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequestDTO {

    private Integer timeSpentSeconds;
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
    private Map<String, Object> answers;
    private JsonNode annotations;
}
