package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationCreateDTO {

    private Long id; // Optional: for updates
    private UUID artifactId;
    private Integer panelNumber;
    private String type; // HIGHLIGHT, NOTE, TAG
    private String content;
    private Integer startLine;
    private Integer endLine;
    private Integer startOffset;
    private Integer endOffset;
    private String color;
    private JsonNode tags;
}
