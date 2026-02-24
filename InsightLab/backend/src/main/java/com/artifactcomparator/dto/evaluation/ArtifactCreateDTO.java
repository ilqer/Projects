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
public class ArtifactCreateDTO {
    private String artifactType;  // BUG_REPORT, CODE_CLONE, SOLID_VIOLATION, SNAPSHOT
    private JsonNode data;         // Contains type-specific fields
}
