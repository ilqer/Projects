package com.artifactcomparator.dto.reviewer;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerComparisonRowDTO {

    private Long assignmentId;
    private Long submissionId;
    private Long participantId;
    private String participantName;
    private LocalDateTime submittedAt;
    private Integer timeSpentSeconds;
    private Integer annotationCount;
    private String reviewerStatus;
    private Integer reviewerQualityScore;
    private JsonNode submissionData;
}
