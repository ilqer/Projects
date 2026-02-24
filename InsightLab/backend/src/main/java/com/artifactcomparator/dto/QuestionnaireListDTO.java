package com.artifactcomparator.dto;

import com.artifactcomparator.model.Questionnaire;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireListDTO {
    
    private Long id;
    private String title;
    private String description;
    private Questionnaire.QuestionnaireType type;
    private Integer version;
    private Boolean isActive;
    private Integer questionCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
