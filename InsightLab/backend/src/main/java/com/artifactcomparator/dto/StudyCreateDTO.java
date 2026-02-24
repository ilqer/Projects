package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyCreateDTO {
    
    @NotBlank(message = "Study title is required")
    @Size(min = 3, max = 255, message = "Study title must be between 3 and 255 characters")
    private String title;
    
    private String description;
    
    @NotBlank(message = "Study objective is required")
    private String objective;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private String comparisonType;
    
    private Boolean blindedMode;
    
    private Integer maxParticipants;
    
    // UC3-2: Custom evaluation criteria and artifacts
    private List<EvaluationCriterionDTO> customCriteria;
    
    private List<StudyArtifactDTO> artifacts;
}
