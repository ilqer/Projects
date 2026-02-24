package com.artifactcomparator.dto.evaluation;

import com.artifactcomparator.model.evaluation.ArtifactReference;
import com.artifactcomparator.model.evaluation.EvaluationCriterionDefinition;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CustomEvaluationTaskRequest {
    private String title;
    private String description;
    private String instructions;
    private List<ArtifactReference> artifactReferences;
    private List<EvaluationCriterionDefinition> criteria;
    private Boolean allowHighlight;
    private Boolean allowAnnotation;
    private Boolean allowTagging;
    private String layoutMode;
    private Boolean blindedMode;
    private List<Long> participantIds;
    private String templateId;
    private LocalDateTime dueDate;
}
