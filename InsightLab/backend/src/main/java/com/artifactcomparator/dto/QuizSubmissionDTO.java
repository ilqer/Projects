package com.artifactcomparator.dto;

import com.artifactcomparator.model.QuizSubmission;
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
public class QuizSubmissionDTO {
    private Long id;
    private Long quizAssignmentId;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private Long questionnaireId;
    private String questionnaireTitle;
    private Integer attemptNumber;
    private QuizSubmission.SubmissionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private Double autoScore;
    private Double manualScore;
    private Double finalScore;
    private Integer totalPointsEarned;
    private Integer totalPointsPossible;
    private Boolean passed;
    private Boolean requiresManualGrading;
    private Integer timeTakenMinutes;
    private Integer timeLimitMinutes;
    private Boolean overTime;
    private List<QuestionAnswerDTO> answers;
}
