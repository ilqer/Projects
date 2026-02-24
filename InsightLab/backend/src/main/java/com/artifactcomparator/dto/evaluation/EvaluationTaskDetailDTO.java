package com.artifactcomparator.dto.evaluation;

import com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO;
import com.artifactcomparator.model.evaluation.ArtifactReference;
import com.artifactcomparator.model.evaluation.EvaluationCriterionDefinition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationTaskDetailDTO {

    private AssignmentDTO assignment;
    private EvaluationTaskDTO task;
    private TaskTypeDTO taskType;
    private List<ArtifactDTO> artifacts;
    private List<CriteriaItemDTO> criteria;
    private List<ArtifactReference> artifactReferences;
    private List<EvaluationCriterionDefinition> dynamicCriteria;
    private List<ViewerArtifactDTO> viewerArtifacts;
    private DraftDataDTO draft;
}
