package com.artifactcomparator.dto;

import com.artifactcomparator.model.Question;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCreateDTO {
    
    @NotBlank(message = "Question text is required")
    private String questionText;
    
    @NotNull(message = "Question type is required")
    private Question.QuestionType type;
    
    private List<QuestionOptionDTO> options;
    
    private String correctAnswer;
    
    private Integer displayOrder = 0;
    
    private Integer points = 1;
}
