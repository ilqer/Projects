package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizAssignmentCreateDTO {

    @NotNull(message = "Questionnaire ID is required")
    private Long questionnaireId;

    @NotEmpty(message = "At least one participant must be selected")
    private List<Long> participantIds;

    private Long studyId; // Optional: link to a specific study

    private LocalDateTime dueDate;

    private Integer maxAttempts = 1;

    private Boolean allowRetake = false;

    private String notes; // Optional notes for participants
}
