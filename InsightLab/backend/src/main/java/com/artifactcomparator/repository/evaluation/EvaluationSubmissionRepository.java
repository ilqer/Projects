package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.EvaluationSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationSubmissionRepository extends JpaRepository<EvaluationSubmission, Long> {

    Optional<EvaluationSubmission> findByAssignmentId(Long assignmentId);

    List<EvaluationSubmission> findByAssignmentParticipantId(Long participantId);

    List<EvaluationSubmission> findByAssignmentEvaluationTaskId(Long evaluationTaskId);

    List<EvaluationSubmission> findByAssignmentEvaluationTaskStudyId(Long studyId);

    List<EvaluationSubmission> findByAssignmentEvaluationTaskStudyIdAndAssignmentEvaluationTaskId(Long studyId, Long taskId);

    List<EvaluationSubmission> findByReviewedByIdOrderByReviewedAtDesc(Long reviewerId);

    boolean existsByAssignmentId(Long assignmentId);
}
