package com.artifactcomparator.model.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Lightweight representation of an artifact that is bound to an evaluation task.
 * Stored as JSON on the EvaluationTask record to avoid rigid task-specific schemas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtifactReference {

    private String id;
    private UUID artifactId;
    private String displayLabel;
    private Integer displayOrder;
    private Boolean blinded;
    private String notes;
    private String type;
}
