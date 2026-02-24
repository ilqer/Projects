package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreRequestDTO {

    private Long criteriaItemId;
    private JsonNode value;
    private String notes;
}
