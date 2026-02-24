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
public class AssignmentDTO {

    private Long id;
    private Long evaluationTaskId;
    private String taskTitle;
    private String taskDescription;
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private String participantUsername;
    private String status;
    private LocalDateTime assignedAt;
    private LocalDateTime dueDate;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private String taskTypeName;
    private String layoutMode;
    private String comparisonMode;
}
