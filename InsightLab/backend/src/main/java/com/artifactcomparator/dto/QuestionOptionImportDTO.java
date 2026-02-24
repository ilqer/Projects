package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionImportDTO {
    
    @NotBlank(message = "Option text is required")
    private String optionText;
    
    private Boolean isCorrect;
    
    private Integer displayOrder;
}
