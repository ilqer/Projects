package com.artifactcomparator.dto;

import com.artifactcomparator.model.AIQuestionGenerationJob;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIQuestionGenerationRequestDTO {
    
    @NotNull(message = "Questionnaire ID is required")
    private Long questionnaireId;
    
    @NotBlank(message = "Topic is required")
    private String topic;
    
    @NotNull(message = "Difficulty is required")
    private AIQuestionGenerationJob.DifficultyLevel difficulty;
    
    @Positive(message = "Number of questions must be positive")
    private Integer numberOfQuestions = 5;
}

