package com.artifactcomparator.dto;

import com.artifactcomparator.model.GradingAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradingActionDTO {
    private Long id;
    private Long submissionId;
    private Long questionAnswerId;
    private Long graderId;
    private String graderName;
    private GradingAction.ActionType actionType;
    private Double pointsBefore;
    private Double pointsAfter;
    private String feedback;
    private String notes;
    private LocalDateTime gradedAt;
}
