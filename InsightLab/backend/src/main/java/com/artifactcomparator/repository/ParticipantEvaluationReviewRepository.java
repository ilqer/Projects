package com.artifactcomparator.repository;

import com.artifactcomparator.model.ParticipantEvaluationReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantEvaluationReviewRepository extends JpaRepository<ParticipantEvaluationReview, Long> {

    // Find reviews by reviewer assignment
    List<ParticipantEvaluationReview> findByReviewerAssignmentIdOrderByCreatedAtDesc(Long assignmentId);

    // Find reviews by reviewer
    List<ParticipantEvaluationReview> findByReviewerIdOrderByReviewedAtDesc(Long reviewerId);

    // Find reviews by study
    List<ParticipantEvaluationReview> findByStudyIdOrderByCreatedAtDesc(Long studyId);

    // Find reviews by participant
    List<ParticipantEvaluationReview> findByParticipantIdOrderByCreatedAtDesc(Long participantId);

    // Find pending reviews for reviewer
    List<ParticipantEvaluationReview> findByReviewerIdAndDecisionOrderByCreatedAtDesc(
            Long reviewerId, 
            ParticipantEvaluationReview.ReviewDecision decision
    );

    // Find reviews by decision
    @Query("SELECT per FROM ParticipantEvaluationReview per " +
           "WHERE per.reviewerAssignment.id = :assignmentId " +
           "AND per.decision = :decision " +
           "ORDER BY per.createdAt DESC")
    List<ParticipantEvaluationReview> findByAssignmentAndDecision(
            @Param("assignmentId") Long assignmentId,
            @Param("decision") ParticipantEvaluationReview.ReviewDecision decision
    );

    // Count reviews by decision for assignment
    long countByReviewerAssignmentIdAndDecision(
            Long assignmentId, 
            ParticipantEvaluationReview.ReviewDecision decision
    );

    // Check if participant evaluation already reviewed
    Optional<ParticipantEvaluationReview> findByReviewerAssignmentIdAndParticipantId(
            Long assignmentId, 
            Long participantId
    );

    // Get statistics for reviewer assignment
    @Query("SELECT per.decision, COUNT(per) FROM ParticipantEvaluationReview per " +
           "WHERE per.reviewerAssignment.id = :assignmentId " +
           "GROUP BY per.decision")
    List<Object[]> getDecisionStatsByAssignment(@Param("assignmentId") Long assignmentId);
}