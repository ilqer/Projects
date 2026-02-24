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
public class CriteriaItemDTO {

    private Long id;
    private Long criteriaSetId;
    private String name;
    private String criterionType;
    private String scaleType;
    private Boolean isRequired;
    private Double weight;
    private JsonNode options;
    private Integer displayOrder;
    private String description;
}
