package com.artifactcomparator.repository;

import com.artifactcomparator.model.GradingAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GradingActionRepository extends JpaRepository<GradingAction, Long> {

    // Find all grading actions for a submission
    List<GradingAction> findBySubmissionIdOrderByGradedAtDesc(Long submissionId);

    // Find all grading actions by a specific grader
    List<GradingAction> findByGraderIdOrderByGradedAtDesc(Long graderId);

    // Find grading actions by action type
    List<GradingAction> findByActionTypeOrderByGradedAtDesc(GradingAction.ActionType actionType);

    // Find grading actions for a specific question answer
    List<GradingAction> findByQuestionAnswerIdOrderByGradedAtDesc(Long questionAnswerId);

    // Find grading actions for a submission by action type
    List<GradingAction> findBySubmissionIdAndActionTypeOrderByGradedAtDesc(Long submissionId, GradingAction.ActionType actionType);

    // Find recent grading actions by a grader within a time range
    @Query("SELECT ga FROM GradingAction ga WHERE ga.grader.id = :graderId " +
           "AND ga.gradedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ga.gradedAt DESC")
    List<GradingAction> findByGraderIdAndDateRange(@Param("graderId") Long graderId,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);

    // Count grading actions by grader
    long countByGraderId(Long graderId);

    // Find all manual grading actions for a researcher
    @Query("SELECT ga FROM GradingAction ga WHERE ga.grader.id = :graderId " +
           "AND ga.actionType IN ('MANUAL_GRADE', 'GRADE_ADJUSTMENT') " +
           "ORDER BY ga.gradedAt DESC")
    List<GradingAction> findManualGradingActionsByGrader(@Param("graderId") Long graderId);

    // Find all grading actions for submissions owned by a researcher
    @Query("SELECT ga FROM GradingAction ga " +
           "WHERE ga.submission.questionnaire.researcher.id = :researcherId " +
           "ORDER BY ga.gradedAt DESC")
    List<GradingAction> findByResearcherIdOrderByGradedAtDesc(@Param("researcherId") Long researcherId);
}
