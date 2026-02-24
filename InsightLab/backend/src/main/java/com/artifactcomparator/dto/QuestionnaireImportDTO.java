package com.artifactcomparator.dto;

import com.artifactcomparator.model.Questionnaire;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireImportDTO {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Type is required")
    private Questionnaire.QuestionnaireType type;
    
    @NotEmpty(message = "Questions array cannot be empty")
    private List<QuestionImportDTO> questions;

    @DecimalMin(value = "1.0", message = "Passing threshold must be at least 1%")
    @DecimalMax(value = "100.0", message = "Passing threshold cannot exceed 100%")
    private Double passingThreshold;
    
    @DecimalMin(value = "1.0", message = "Intermediate threshold must be at least 1%")
    @DecimalMax(value = "100.0", message = "Intermediate threshold cannot exceed 100%")
    private Double intermediateThreshold;
    
    @DecimalMin(value = "1.0", message = "Advanced threshold must be at least 1%")
    @DecimalMax(value = "100.0", message = "Advanced threshold cannot exceed 100%")
    private Double advancedThreshold;

    private Integer timeLimitMinutes;
    private Boolean showCorrectAnswers = true;
    private Boolean randomizeQuestions = false;
    private Boolean randomizeOptions = false;
    private Boolean allowReview = true;
    private Questionnaire.GradingMethod gradingMethod = Questionnaire.GradingMethod.AUTOMATIC;
}
