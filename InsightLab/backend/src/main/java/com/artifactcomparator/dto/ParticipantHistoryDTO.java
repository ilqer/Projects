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
public class ParticipantHistoryDTO {
    private Long studyId;
    private String studyTitle;
    private String studyDescription;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
    private String enrollmentStatus;
    private Integer progress;
    
    // Tasks completed in this study
    private List<CompletedTaskDTO> completedTasks;
    
    // Statistics
    private Integer totalTasksCompleted;
    private Integer totalEvaluationsCompleted;
    private Integer totalQuizzesCompleted;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompletedTaskDTO {
        private Long taskId;
        private String taskType; // "EVALUATION" or "QUIZ"
        private String taskTitle;
        private LocalDateTime completedAt;
        private Integer score;
        private String status;
    }
}
