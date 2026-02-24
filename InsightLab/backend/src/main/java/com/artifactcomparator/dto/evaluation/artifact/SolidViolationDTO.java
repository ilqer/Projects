package com.artifactcomparator.dto.evaluation.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolidViolationDTO extends ArtifactDTO {

    private String codeSnippet;
    private String language;
    private String llmAnalysis;
    private String llmSuggestedFix;
    private String difficultyLevel;
    private JsonNode additionalData;

    // Note: correctViolationType is intentionally excluded from DTO to hide from participants
}
