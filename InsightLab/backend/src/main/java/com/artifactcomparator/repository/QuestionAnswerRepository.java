package com.artifactcomparator.repository;

import com.artifactcomparator.model.QuestionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer, Long> {

    // Find all answers for a submission
    List<QuestionAnswer> findBySubmissionIdOrderByQuestionIdAsc(Long submissionId);

    // Find answers requiring manual grading for a submission
    List<QuestionAnswer> findBySubmissionIdAndRequiresManualGradingTrue(Long submissionId);

    // Find a specific answer by submission and question
    Optional<QuestionAnswer> findBySubmissionIdAndQuestionId(Long submissionId, Long questionId);

    // Find all answers for a specific question across all submissions
    List<QuestionAnswer> findByQuestionIdOrderByAnsweredAtDesc(Long questionId);

    // Count correct answers for a submission
    @Query("SELECT COUNT(a) FROM QuestionAnswer a WHERE a.submission.id = :submissionId AND a.isCorrect = true")
    long countCorrectAnswersBySubmission(@Param("submissionId") Long submissionId);

    // Count answers requiring manual grading for a submission
    long countBySubmissionIdAndRequiresManualGradingTrue(Long submissionId);

    // Get total points earned for a submission
    @Query("SELECT COALESCE(SUM(a.pointsEarned), 0) FROM QuestionAnswer a WHERE a.submission.id = :submissionId")
    Double sumPointsEarnedBySubmission(@Param("submissionId") Long submissionId);
}
