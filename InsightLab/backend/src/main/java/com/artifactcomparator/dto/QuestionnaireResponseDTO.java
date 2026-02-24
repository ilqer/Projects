package com.artifactcomparator.dto;

import com.artifactcomparator.model.Questionnaire;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireResponseDTO {
    
    private Long id;
    private String title;
    private String description;
    private Questionnaire.QuestionnaireType type;
    private Integer version;
    private Boolean isActive;
    private Long researcherId;
    private String researcherName;
    private Integer questionCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuestionResponseDTO> questions;
    
    // UC4-2: Scoring Configuration
    private Double passingThreshold;
    private Double intermediateThreshold;
    private Double advancedThreshold;
    private Integer timeLimitMinutes;
    private Integer totalPoints;
    private Boolean showCorrectAnswers;
    private Boolean randomizeQuestions;
    private Boolean randomizeOptions;
    private Boolean allowReview;
    private Questionnaire.GradingMethod gradingMethod;

    private List<QuestionnaireStudyDTO> linkedStudies;
}
