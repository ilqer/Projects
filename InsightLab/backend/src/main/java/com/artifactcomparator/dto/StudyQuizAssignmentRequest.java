package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class StudyQuizAssignmentRequest {

    @NotEmpty(message = "At least one participant must be selected")
    private List<Long> participantIds;

    private LocalDateTime dueDate;

    private Integer maxAttempts;

    private Boolean allowRetake;

    private String notes;
}
