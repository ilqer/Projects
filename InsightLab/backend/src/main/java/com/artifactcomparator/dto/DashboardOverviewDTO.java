package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardOverviewDTO {
    private Integer totalStudies;
    private Integer activeStudies;
    private Integer draftStudies;
    private Integer completedStudies;
    private Integer totalParticipants;
    private Integer totalArtifacts;
    private Double averageCompletionRate;
    private Double averageRating;
    private List<StudyStatDTO> studyStats;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudyStatDTO {
        private Long studyId;
        private String studyTitle;
        private String status;
        private Integer participantCount;
        private Integer completedParticipants;
        private Double completionPercentage;
        private Double averageRating;
        private Integer totalEvaluations;
    }
}
