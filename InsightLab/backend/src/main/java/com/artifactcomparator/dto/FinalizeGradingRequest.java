package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalizeGradingRequest {
    @NotNull(message = "Submission ID is required")
    private Long submissionId;

    private String finalComments; // Final comments from grader to participant

    @Builder.Default
    private Boolean returnToParticipant = true; // Whether to immediately return results to participant
}
