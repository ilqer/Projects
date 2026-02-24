package com.artifactcomparator.dto.evaluation;

import com.artifactcomparator.model.evaluation.ArtifactReference;
import com.artifactcomparator.model.evaluation.EvaluationCriterionDefinition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationTaskDTO {

    private Long id;
    private Long taskTypeId;
    private Long studyId;
    private String title;
    private String description;
    private String instructions;
    private String status;
    private LocalDateTime dueDate;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean allowHighlight;
    private Boolean allowAnnotation;
    private Boolean allowTagging;
    private String layoutMode;
    private String cloneOriginalCodeContent;
    private String cloneCloneCodeContent;
    private String bugReportJson;
    private String solidJson;
    private Boolean blindedMode;
    private List<Integer> blindedOrder;
    private List<ArtifactReference> artifacts;
    private List<EvaluationCriterionDefinition> criteria;
}
