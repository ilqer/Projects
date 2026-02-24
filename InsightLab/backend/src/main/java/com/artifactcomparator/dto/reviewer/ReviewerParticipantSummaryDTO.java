package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerParticipantSummaryDTO {

    private Long participantId;
    private String participantName;
    private long evaluationCount;
    private long suspiciousCount;
    private long incompleteCount;
    private Double averageQualityScore;
}
