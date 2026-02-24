package com.artifactcomparator.dto.evaluation.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BugReportDTO extends ArtifactDTO {

    private String title;
    private String description;
    private String severity;
    private String priority;
    private String reporter;
    private LocalDateTime dateReported;
    private String llmSuggestedCategory;
    private JsonNode additionalData;

    // Note: correctCategory is intentionally excluded from DTO to hide from participants
}
