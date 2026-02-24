package com.artifactcomparator.dto.evaluation.artifact;

import com.artifactcomparator.dto.TagDTO;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "artifactType")
@JsonSubTypes({
    @JsonSubTypes.Type(value = BugReportDTO.class, name = "BUG_REPORT"),
    @JsonSubTypes.Type(value = CodeCloneDTO.class, name = "CODE_CLONE"),
    @JsonSubTypes.Type(value = SolidViolationDTO.class, name = "SOLID_VIOLATION"),
    @JsonSubTypes.Type(value = SnapshotDTO.class, name = "SNAPSHOT")
})
public abstract class ArtifactDTO {

    private UUID id;
    private String artifactType;
    private Long evaluationTaskId;
    private Integer panelNumber;
    private Integer displayOrder;
    private JsonNode metadata;
    private String displayLabel;
    private Boolean blinded;
    private List<TagDTO> tags;
}
