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
public class CodeCloneDTO extends ArtifactDTO {

    private String codeSnippet1;
    private String codeSnippet2;
    private String language;
    private Double similarityScore;
    private JsonNode additionalData;

    // Note: correctCloneType is intentionally excluded from DTO to hide from participants
}
