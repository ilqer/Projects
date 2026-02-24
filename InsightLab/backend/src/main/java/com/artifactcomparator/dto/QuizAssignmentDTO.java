package com.artifactcomparator.dto;

import com.artifactcomparator.model.QuizAssignment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAssignmentDTO {
    private Long id;
    private Long questionnaireId;
    private String questionnaireTitle;
    private String questionnaireDescription;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private Long researcherId;
    private String researcherName;
    private Long studyId;
    private String studyTitle;
    private QuizAssignment.AssignmentStatus status;
    private LocalDateTime dueDate;
    private Integer maxAttempts;
    private Integer attemptsTaken;
    private Boolean allowRetake;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime declinedAt;
    private LocalDateTime completedAt;
    private Double score;
    private Boolean passed;
    private String notes;
    private String declineReason;
    private Boolean overdue;
    private Boolean canRetake;
}
