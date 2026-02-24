package com.artifactcomparator.dto;

import com.artifactcomparator.model.AIQuestionDraft;
import com.artifactcomparator.model.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIQuestionDraftDTO {
    
    private Long id;
    private Long jobId;
    private Long questionnaireId;
    private String questionText;
    private Question.QuestionType type;
    private String correctAnswer;
    private Integer points;
    private Integer displayOrder;
    private List<AIQuestionDraftOptionDTO> options;
    private AIQuestionDraft.DraftStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

