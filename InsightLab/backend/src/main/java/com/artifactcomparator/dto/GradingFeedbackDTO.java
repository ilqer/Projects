package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingFeedbackDTO {
    private Long id;
    private Long questionAnswerId;
    private Long graderId;
    private String graderName;
    private String feedbackText;
    private Double pointsAwarded;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
