package com.artifactcomparator.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskTypeCreateDTO {
    private String name;
    private String description;
    private String artifactType;  // BUG_REPORT, CODE_CLONE, SOLID_VIOLATION, SNAPSHOT
    private String layoutMode;    // TWO_PANEL, THREE_PANEL, SINGLE_PANEL
    private String comparisonMode; // TEXTUAL, SEMANTIC, VISUAL
    private List<CriteriaItemCreateDTO> criteriaItems;
}
