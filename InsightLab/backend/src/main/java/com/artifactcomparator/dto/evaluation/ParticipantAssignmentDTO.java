package com.artifactcomparator.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantAssignmentDTO {
    private Long id;
    private Long evaluationTaskId;
    private String evaluationTaskTitle;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private String participantUsername;
    private Long assignedById;
    private String assignedByName;
    private String status;
    private LocalDateTime assignedAt;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private Integer completedCount;
    private Integer totalCount;
    private String participantLevel; // BEGINNER, INTERMEDIATE, ADVANCED or null
}
