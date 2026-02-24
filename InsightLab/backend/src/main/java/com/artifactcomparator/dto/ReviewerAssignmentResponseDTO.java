package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerAssignmentResponseDTO {
    private Boolean success;
    private String message;
    private Integer assignedCount;
    private Integer alreadyAssignedCount;
    private List<String> alreadyAssignedReviewers;
    private List<Long> assignmentIds;
}