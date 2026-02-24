package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualGradeRequest {
    @NotNull(message = "Question answer ID is required")
    private Long questionAnswerId;

    @NotNull(message = "Points earned is required")
    @DecimalMin(value = "0.0", message = "Points earned must be at least 0")
    private Double pointsEarned;

    private String feedbackText;

    private String internalNotes; // Notes for other graders, not shown to participant
}
