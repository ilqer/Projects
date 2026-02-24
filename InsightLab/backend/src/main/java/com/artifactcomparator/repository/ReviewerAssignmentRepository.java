package com.artifactcomparator.repository;

import com.artifactcomparator.model.ReviewerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewerAssignmentRepository extends JpaRepository<ReviewerAssignment, Long> {

    // Find assignments by reviewer
    List<ReviewerAssignment> findByReviewerIdOrderByAssignedAtDesc(Long reviewerId);

    // Find assignments by reviewer and status
    List<ReviewerAssignment> findByReviewerIdAndStatusOrderByAssignedAtDesc(
            Long reviewerId, 
            ReviewerAssignment.AssignmentStatus status
    );

    // Find assignments by reviewer and status list
    List<ReviewerAssignment> findByReviewerIdAndStatusInOrderByAssignedAtDesc(
            Long reviewerId, 
            List<ReviewerAssignment.AssignmentStatus> statuses
    );

    // Find assignments by study
    List<ReviewerAssignment> findByStudyIdOrderByAssignedAtDesc(Long studyId);

    // Find assignments by researcher (who assigned)
    List<ReviewerAssignment> findByAssignedByIdOrderByAssignedAtDesc(Long researcherId);

    // Check if reviewer already assigned to study
    Optional<ReviewerAssignment> findByStudyIdAndReviewerId(Long studyId, Long reviewerId);

    // Count pending assignments for reviewer
    long countByReviewerIdAndStatus(Long reviewerId, ReviewerAssignment.AssignmentStatus status);

    // Find accepted/in-progress assignments for a study
    @Query("SELECT ra FROM ReviewerAssignment ra WHERE ra.study.id = :studyId " +
           "AND ra.status IN ('ACCEPTED', 'IN_PROGRESS') " +
           "ORDER BY ra.assignedAt DESC")
    List<ReviewerAssignment> findActiveReviewersByStudy(@Param("studyId") Long studyId);

    // Check if reviewer has any active assignment for study
    @Query("SELECT CASE WHEN COUNT(ra) > 0 THEN true ELSE false END " +
           "FROM ReviewerAssignment ra WHERE ra.study.id = :studyId " +
           "AND ra.reviewer.id = :reviewerId " +
           "AND ra.status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS')")
    boolean hasActiveAssignment(@Param("studyId") Long studyId, @Param("reviewerId") Long reviewerId);
}