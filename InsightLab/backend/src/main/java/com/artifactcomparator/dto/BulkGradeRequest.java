package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkGradeRequest {
    @NotNull(message = "Submission ID is required")
    private Long submissionId;

    @NotEmpty(message = "At least one answer must be graded")
    @Valid
    private List<ManualGradeRequest> grades;

    private String overallFeedback; // Overall feedback for the entire submission
}
