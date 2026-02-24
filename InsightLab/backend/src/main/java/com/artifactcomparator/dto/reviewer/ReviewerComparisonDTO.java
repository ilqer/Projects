package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerComparisonDTO {

    private Long studyId;
    private String studyTitle;
    private Long taskId;
    private String taskTitle;
    private String artifactType;
    private List<ReviewerComparisonRowDTO> rows;
}
