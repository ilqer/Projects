package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerDashboardFilter {

    private Long participantId;
    private String reviewerStatus;
    private Long taskId;
    private String taskType;
    private LocalDateTime submittedFrom;
    private LocalDateTime submittedTo;
    private Integer qualityScore;
    private Integer minQualityScore;
    private Integer maxQualityScore;
    private Integer minTimeSeconds;
    private Integer maxTimeSeconds;
}
