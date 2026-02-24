package com.artifactcomparator.dto.evaluation;

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
public class EvaluationTaskDetailResponseDTO {

    private EvaluationTaskDTO task;
    private List<ArtifactReference> artifactReferences;
    private List<EvaluationCriterionDefinition> criteria;
    private List<ParticipantAssignmentDTO> assignments;
}
