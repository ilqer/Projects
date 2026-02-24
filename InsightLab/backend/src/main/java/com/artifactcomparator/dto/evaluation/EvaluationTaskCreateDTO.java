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
public class EvaluationTaskCreateDTO {
    private Long studyId;  // Required - evaluation tasks must be created within a study
    private Long taskTypeId;
    private String title;
    private String description;
    private String instructions;
    private List<ArtifactCreateDTO> artifacts;
    private List<ArtifactReference> artifactReferences;
    private List<EvaluationCriterionDefinition> criteria;
    private List<Long> participantIds;
    private LocalDateTime dueDate;
    private Boolean blindedMode;
    private Boolean allowHighlight;
    private Boolean allowAnnotation;
    private Boolean allowTagging;
    private String layoutMode;
}
