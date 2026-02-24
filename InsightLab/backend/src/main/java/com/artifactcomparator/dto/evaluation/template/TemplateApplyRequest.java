package com.artifactcomparator.dto.evaluation.template;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TemplateApplyRequest {
    @NotBlank
    private String templateId;
}
