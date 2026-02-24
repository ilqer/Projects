package com.artifactcomparator.dto.reviewer;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewerEvaluationDecisionRequest {

    @NotBlank
    private String reviewerStatus;

    private String reviewerNotes;

    @Min(1)
    @Max(5)
    private Integer reviewerQualityScore;
}
