package com.artifactcomparator.dto;

import com.artifactcomparator.model.Questionnaire;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireCreateDTO {
    
    @NotBlank(message = "Questionnaire title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    private String title;
    
    private String description;
    
    @NotNull(message = "Questionnaire type is required")
    private Questionnaire.QuestionnaireType type;
    
    @NotEmpty(message = "At least one question is required")
    @Valid
    private List<QuestionCreateDTO> questions;
    
    // UC4-2: Scoring Configuration
    @DecimalMin(value = "1.0", message = "Passing threshold must be at least 1%")
    @DecimalMax(value = "100.0", message = "Passing threshold cannot exceed 100%")
    private Double passingThreshold;
    
    @DecimalMin(value = "1.0", message = "Intermediate threshold must be at least 1%")
    @DecimalMax(value = "100.0", message = "Intermediate threshold cannot exceed 100%")
    private Double intermediateThreshold;
    
    @DecimalMin(value = "1.0", message = "Advanced threshold must be at least 1%")
    @DecimalMax(value = "100.0", message = "Advanced threshold cannot exceed 100%")
    private Double advancedThreshold;
    
    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private Integer timeLimitMinutes;
    
    private Boolean showCorrectAnswers = true;
    
    private Boolean randomizeQuestions = false;
    
    private Boolean randomizeOptions = false;
    
    private Boolean allowReview = true;
    
    private Questionnaire.GradingMethod gradingMethod = Questionnaire.GradingMethod.AUTOMATIC;
}
