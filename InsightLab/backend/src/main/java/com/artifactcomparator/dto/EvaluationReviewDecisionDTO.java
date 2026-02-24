package com.artifactcomparator.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationReviewDecisionDTO {

    @NotNull(message = "Decision is required")
    private String decision; // "ACCEPT", "REJECT", "FLAG"

    // Quality ratings (1-5)
    @Min(value = 1, message = "Quality rating must be between 1 and 5")
    @Max(value = 5, message = "Quality rating must be between 1 and 5")
    private Integer qualityRating;

    @Min(value = 1, message = "Consistency rating must be between 1 and 5")
    @Max(value = 5, message = "Consistency rating must be between 1 and 5")
    private Integer consistencyRating;

    @Min(value = 1, message = "Completeness rating must be between 1 and 5")
    @Max(value = 5, message = "Completeness rating must be between 1 and 5")
    private Integer completenessRating;

    // Issues found (checkbox values)
    private List<String> issues;

    // Comments
    private String comments;

    // Flag reason (zorunlu eğer decision = FLAG)
    private String flagReason;
}