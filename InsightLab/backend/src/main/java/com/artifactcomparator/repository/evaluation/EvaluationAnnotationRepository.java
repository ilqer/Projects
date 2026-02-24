package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.EvaluationAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvaluationAnnotationRepository extends JpaRepository<EvaluationAnnotation, Long> {

    List<EvaluationAnnotation> findByAssignmentId(Long assignmentId);

    List<EvaluationAnnotation> findByAssignmentIdAndArtifactId(Long assignmentId, UUID artifactId);

    List<EvaluationAnnotation> findByAssignmentIdAndPanelNumber(Long assignmentId, Integer panelNumber);

    void deleteByAssignmentId(Long assignmentId);

    long countByAssignmentId(Long assignmentId);
}
