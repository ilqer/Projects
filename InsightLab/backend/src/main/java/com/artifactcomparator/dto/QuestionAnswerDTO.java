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
public class QuestionAnswerDTO {
    private Long id;
    private Long submissionId;
    private Long questionId;
    private String questionText;
    private String questionType;
    private String answerText;
    private List<Long> selectedOptionIds;
    private Boolean isCorrect;
    private Double pointsEarned;
    private Integer pointsPossible;
    private Boolean requiresManualGrading;
    private LocalDateTime answeredAt;
    private List<GradingFeedbackDTO> feedbackList;
    private String correctAnswer; // For reference when grading
    private List<QuestionOptionSummaryDTO> options; // For displaying MCQ options
}
