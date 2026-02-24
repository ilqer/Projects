package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionDTO {
    
    private Long id;
    private String optionText;
    private Boolean isCorrect;
    private Integer displayOrder;
}
