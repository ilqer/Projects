package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionDTO {
    private Long id;
    private String questionText;
    private String type; // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER
    private Integer points;
    private Integer displayOrder;
    private List<QuizQuestionOptionDTO> options; // For MCQ questions
}
