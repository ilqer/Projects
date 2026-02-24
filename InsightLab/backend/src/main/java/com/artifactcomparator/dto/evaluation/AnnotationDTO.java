package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationDTO {

    private Long id;
    private Long assignmentId;
    private UUID artifactId;
    private Integer panelNumber;
    private String annotationType;
    private String content;
    private Integer startLine;
    private Integer endLine;
    private Integer startOffset;
    private Integer endOffset;
    private String color;
    private JsonNode tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
