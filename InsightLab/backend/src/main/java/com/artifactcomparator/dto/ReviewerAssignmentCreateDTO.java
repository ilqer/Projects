package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotEmpty;
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
public class ReviewerAssignmentCreateDTO {

    @NotNull(message = "Study ID is required")
    private Long studyId;

    @NotEmpty(message = "At least one reviewer must be selected")
    private List<Long> reviewerIds;

    private String notes; // Optional notes from researcher
}