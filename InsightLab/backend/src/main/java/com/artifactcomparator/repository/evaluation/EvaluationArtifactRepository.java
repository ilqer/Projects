package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.artifact.EvaluationArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvaluationArtifactRepository extends JpaRepository<EvaluationArtifact, UUID> {

    List<EvaluationArtifact> findByEvaluationTaskIdOrderByDisplayOrder(Long evaluationTaskId);

    List<EvaluationArtifact> findByEvaluationTaskIdAndPanelNumber(Long evaluationTaskId, Integer panelNumber);
}
