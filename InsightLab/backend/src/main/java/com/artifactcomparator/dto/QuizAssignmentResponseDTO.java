package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAssignmentResponseDTO {
    private String message;
    private Integer totalAssigned;
    private Integer successCount;
    private Integer failureCount;
}
