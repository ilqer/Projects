package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.EvaluationDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluationDraftRepository extends JpaRepository<EvaluationDraft, Long> {

    Optional<EvaluationDraft> findByAssignmentId(Long assignmentId);

    void deleteByAssignmentId(Long assignmentId);
}
