package com.artifactcomparator.model.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic criterion configuration persisted with each evaluation task.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCriterionDefinition {

    private String id;
    private String type;
    private String name;
    private String description;
    private boolean required;
    private Integer scaleMin;
    private Integer scaleMax;
    private List<String> options;
    private String placeholder;
}
