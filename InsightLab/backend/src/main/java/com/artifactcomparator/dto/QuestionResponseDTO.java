package com.artifactcomparator.dto;

import com.artifactcomparator.model.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponseDTO {
    
    private Long id;
    private String questionText;
    private Question.QuestionType type;
    private List<QuestionOptionDTO> options;
    private String correctAnswer;
    private Integer displayOrder;
    private Integer points;
    private Integer version;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
