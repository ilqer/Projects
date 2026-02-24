package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionSummaryDTO {
    private Long id;
    private String optionText;
    private Boolean isCorrect; // Only shown to grader, not to participant during quiz
    private Integer displayOrder;
}
