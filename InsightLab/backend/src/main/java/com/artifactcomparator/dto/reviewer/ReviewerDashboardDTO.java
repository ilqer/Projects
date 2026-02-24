package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerDashboardDTO {

    private Long studyId;
    private String studyTitle;
    private ReviewerDashboardStatsDTO stats;
    private List<ReviewerEvaluationSummaryDTO> suspiciousEvaluations;
    private List<ReviewerEvaluationSummaryDTO> incompleteEvaluations;
    private List<ReviewerEvaluationSummaryDTO> fastEvaluations;
    private Map<Integer, Long> qualityDistribution;
    private List<ReviewerParticipantSummaryDTO> participantSummaries;
    private ReviewerFilterOptionsDTO filterOptions;
    private List<ReviewerEvaluationSummaryDTO> evaluations;
    private int fastThresholdSeconds;
}
