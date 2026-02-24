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
public class ReviewerEvaluationDecisionResponse {

    private Long assignmentId;
    private Long submissionId;
    private String reviewerStatus;
    private Integer reviewerQualityScore;
    private String reviewerNotes;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByName;
}
