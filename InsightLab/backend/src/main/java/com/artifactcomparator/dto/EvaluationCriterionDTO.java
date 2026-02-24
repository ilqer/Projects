package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCriterionDTO {
    
    private Long id;
    
    @NotBlank(message = "Criterion name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Rating format is required")
    private String ratingFormat; // FIVE_STAR, TEN_POINT, BINARY, MULTIPLE_CHOICE, TEXT
    
    private String ratingOptions; // For MULTIPLE_CHOICE, comma-separated options
    
    private Integer displayOrder;
}
