package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyResponseDTO {
    
    private Long id;
    private String title;
    private String description;
    private String objective;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Long researcherId;
    private String researcherName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String comparisonType;
    private Boolean blindedMode;
    private Integer maxParticipants;
    private Long daysRemaining;
    private Boolean isActive;
    private Boolean canParticipate;
    
    // UC3-2: Custom evaluation criteria and artifacts
    private List<EvaluationCriterionDTO> customCriteria;
    private List<StudyArtifactDTO> artifacts;
    private List<StudyQuizDTO> quizzes;
    private Integer artifactCount;
}
