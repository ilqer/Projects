package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyStatisticsDTO {
    private Long studyId;
    private String studyTitle;
    private String status;
    
    // Participant statistics
    private Integer totalEnrolled;
    private Integer activeParticipants;
    private Integer completedParticipants;
    private Integer droppedParticipants;
    private Double completionRate;
    
    // Evaluation statistics
    private Integer totalEvaluations;
    private Integer completedEvaluations;
    private Integer pendingEvaluations;
    private Double averageQualityRating;
    private Double averageConsistencyRating;
    private Double averageCompletenessRating;
    private Double overallAverageRating;
    
    // Review statistics
    private Integer acceptedReviews;
    private Integer rejectedReviews;
    private Integer flaggedReviews;
    private Integer pendingReviews;
    
    // Time statistics
    private Integer averageEvaluationTimeMinutes;
    private LocalDateTime lastActivityAt;
}
