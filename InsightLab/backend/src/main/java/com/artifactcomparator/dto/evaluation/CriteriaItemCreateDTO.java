package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriteriaItemCreateDTO {
    private String name;
    private String description;
    private String criterionType;  // SELECTION, RATING, TEXT_INPUT, MULTIPLE_CHOICE, BOOLEAN
    private String scaleType;      // LIKERT_5, NUMERIC_10, CATEGORICAL, BOOLEAN
    private Boolean isRequired;
    private Integer displayOrder;
    private Double weight;
    private JsonNode options;      // For possible values, min/max, etc.
}
