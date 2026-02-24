package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.ParticipantTaskAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantTaskAssignmentRepository extends JpaRepository<ParticipantTaskAssignment, Long> {

    Optional<ParticipantTaskAssignment> findByIdAndParticipantId(Long id, Long participantId);

    Page<ParticipantTaskAssignment> findByParticipantId(Long participantId, Pageable pageable);

    Page<ParticipantTaskAssignment> findByParticipantIdAndStatus(Long participantId, ParticipantTaskAssignment.AssignmentStatus status, Pageable pageable);

    Page<ParticipantTaskAssignment> findByParticipantIdAndStatusIn(
            Long participantId,
            List<ParticipantTaskAssignment.AssignmentStatus> statuses,
            Pageable pageable
    );

    List<ParticipantTaskAssignment> findByEvaluationTaskId(Long evaluationTaskId);

    List<ParticipantTaskAssignment> findByParticipantIdAndStatus(
            Long participantId,
            ParticipantTaskAssignment.AssignmentStatus status
    );

    @Query("SELECT COUNT(a) FROM ParticipantTaskAssignment a WHERE a.participant.id = :participantId AND a.status = :status")
    long countByParticipantIdAndStatus(Long participantId, ParticipantTaskAssignment.AssignmentStatus status);

    boolean existsByEvaluationTaskIdAndParticipantId(Long evaluationTaskId, Long participantId);

    List<ParticipantTaskAssignment> findByEvaluationTaskCreatedById(Long createdById);
}
