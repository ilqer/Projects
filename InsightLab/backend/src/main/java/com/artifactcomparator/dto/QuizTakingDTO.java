package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizTakingDTO {
    private Long submissionId;
    private Long questionnaireId;
    private String questionnaireTitle;
    private String questionnaireDescription;
    private Integer timeLimitMinutes;
    private Integer totalPoints;
    private Double passingThreshold;
    private Boolean allowReview;
    private LocalDateTime startedAt;
    private List<QuizQuestionDTO> questions;
    private List<QuestionAnswerDTO> answers;
}
