package com.artifactcomparator.dto;

import com.artifactcomparator.model.QuizSubmission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummaryDTO {
    private Long id;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private Long questionnaireId;
    private String questionnaireTitle;
    private Integer attemptNumber;
    private QuizSubmission.SubmissionStatus status;
    private LocalDateTime submittedAt;
    private Double finalScore;
    private Boolean passed;
    private Boolean requiresManualGrading;
    private Integer questionsRequiringGrading;
    private Integer totalQuestions;
}
