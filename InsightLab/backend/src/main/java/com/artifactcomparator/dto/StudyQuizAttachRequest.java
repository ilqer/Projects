package com.artifactcomparator.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StudyQuizAttachRequest {

    @NotNull(message = "Questionnaire ID is required")
    private Long questionnaireId;

    @Min(value = 0, message = "Display order cannot be negative")
    private Integer displayOrder;
}
