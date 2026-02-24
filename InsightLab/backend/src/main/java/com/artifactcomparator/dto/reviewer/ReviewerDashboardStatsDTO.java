package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerDashboardStatsDTO {

    private long totalEvaluations;
    private long validEvaluations;
    private long suspiciousEvaluations;
    private long incompleteEvaluations;
    private long fastEvaluations;
    private Double averageQualityScore;
}
