package com.artifactcomparator.dto.evaluation.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SnapshotDTO extends ArtifactDTO {

    private UUID referenceImageId;
    private UUID failureImageId;
    private UUID diffImageId;
    private String testName;
    private String componentName;
    private JsonNode additionalData;

    // Note: correctVerdict is intentionally excluded from DTO to hide from participants
}
