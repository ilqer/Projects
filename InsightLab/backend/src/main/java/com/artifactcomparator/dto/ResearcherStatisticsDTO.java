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
public class ResearcherStatisticsDTO {

    private OverviewStats overview;
    private ParticipantStats participantStats;
    private ArtifactStats artifactStats;
    private EvaluationStats evaluationStats;
    private List<StudyPerformanceDTO> topStudies;
    private List<ActivityDTO> recentActivity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewStats {
        private int totalStudies;
        private int activeStudies;
        private int draftStudies;
        private int completedStudies;
        private int totalParticipants;
        private int totalArtifacts;
        private double averageCompletionRate;
        private double averageRating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantStats {
        private int invited;
        private int enrolled;
        private int inProgress;
        private int completed;
        private int dropped;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArtifactStats {
        private int totalStudyArtifacts;
        private int uniqueArtifacts;
        private List<CategoryValue> topTypes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationStats {
        private int totalTasks;
        private int activeTasks;
        private int completedTasks;
        private int draftTasks;
        private int totalAssignments;
        private int pendingAssignments;
        private int inProgressAssignments;
        private int submittedAssignments;
        private int reviewedAssignments;
        private double completionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudyPerformanceDTO {
        private Long studyId;
        private String title;
        private String status;
        private int participants;
        private double completionRate;
        private double averageRating;
        private int activeTasks;
        private int artifactCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDTO {
        private String type;
        private String title;
        private String description;
        private LocalDateTime timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryValue {
        private String label;
        private long value;
    }
}
