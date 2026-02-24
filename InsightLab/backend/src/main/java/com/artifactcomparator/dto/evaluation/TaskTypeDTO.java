package com.artifactcomparator.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTypeDTO {

    private Long id;
    private String name;
    private String artifactType;
    private String layoutMode;
    private String comparisonMode;
    private String description;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}
