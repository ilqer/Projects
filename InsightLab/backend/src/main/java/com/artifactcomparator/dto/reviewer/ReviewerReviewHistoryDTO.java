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
public class ReviewerReviewHistoryDTO {

    private Long id;
    private Long assignmentId;
    private Long studyId;
    private String studyName;
    private Long participantId;
    private String participantName;
    private LocalDateTime reviewDate;
    private String decision;
    private Integer qualityScore;
    private Integer issuesFound;
    private String timeSpent;
}
