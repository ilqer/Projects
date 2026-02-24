package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionOptionDTO {
    private Long id;
    private String optionText;
    private Integer displayOrder;
    // isCorrect is NOT included - only shown to graders, not to participants during quiz
}
