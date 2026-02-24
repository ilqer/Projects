package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDraftRequestDTO {
    
    private String questionText;
    private String correctAnswer;
    private Integer points;
    private List<DraftOptionUpdateDTO> options;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DraftOptionUpdateDTO {
        private String optionText;
        private Boolean isCorrect;
        private Integer displayOrder;
    }
}

