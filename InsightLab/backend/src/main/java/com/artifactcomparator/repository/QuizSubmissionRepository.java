package com.artifactcomparator.repository;

import com.artifactcomparator.model.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {

    // Find all submissions for a specific quiz assignment
    List<QuizSubmission> findByQuizAssignmentIdOrderByAttemptNumberDesc(Long quizAssignmentId);

    // Find all submissions by a participant
    List<QuizSubmission> findByParticipantIdOrderByStartedAtDesc(Long participantId);

    // Find all submissions for a questionnaire
    List<QuizSubmission> findByQuestionnaireIdOrderBySubmittedAtDesc(Long questionnaireId);

    // Find submissions by status
    List<QuizSubmission> findByStatusOrderBySubmittedAtDesc(QuizSubmission.SubmissionStatus status);

    // Find submissions requiring manual grading
    List<QuizSubmission> findByRequiresManualGradingTrueAndStatusOrderBySubmittedAtDesc(QuizSubmission.SubmissionStatus status);

    // Find submissions by questionnaire that require manual grading
    @Query("SELECT s FROM QuizSubmission s WHERE s.questionnaire.id = :questionnaireId " +
           "AND s.requiresManualGrading = true " +
           "AND s.status IN ('SUBMITTED', 'GRADED') " +
           "ORDER BY s.submittedAt DESC")
    List<QuizSubmission> findSubmissionsRequiringManualGradingByQuestionnaire(@Param("questionnaireId") Long questionnaireId);

    // Find all submissions for a researcher's questionnaires
    @Query("SELECT s FROM QuizSubmission s WHERE s.questionnaire.researcher.id = :researcherId " +
           "ORDER BY s.submittedAt DESC")
    List<QuizSubmission> findByResearcherId(@Param("researcherId") Long researcherId);

    // Find all submissions for a researcher's questionnaires with specific status
    @Query("SELECT s FROM QuizSubmission s WHERE s.questionnaire.researcher.id = :researcherId " +
           "AND s.status = :status " +
           "ORDER BY s.submittedAt DESC")
    List<QuizSubmission> findByResearcherIdAndStatus(@Param("researcherId") Long researcherId,
                                                      @Param("status") QuizSubmission.SubmissionStatus status);

    // Find a specific submission by quiz assignment and attempt number
    Optional<QuizSubmission> findByQuizAssignmentIdAndAttemptNumber(Long quizAssignmentId, Integer attemptNumber);

    // Count submissions by questionnaire
    long countByQuestionnaireId(Long questionnaireId);

    // Count submissions requiring manual grading for a researcher
    @Query("SELECT COUNT(s) FROM QuizSubmission s WHERE s.questionnaire.researcher.id = :researcherId " +
           "AND s.requiresManualGrading = true " +
           "AND s.status = 'SUBMITTED'")
    long countPendingManualGradingByResearcher(@Param("researcherId") Long researcherId);

    // Find latest submission for a quiz assignment
    Optional<QuizSubmission> findFirstByQuizAssignmentIdOrderByAttemptNumberDesc(Long quizAssignmentId);
}
