package com.artifactcomparator.repository;

import com.artifactcomparator.model.QuizAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAssignmentRepository extends JpaRepository<QuizAssignment, Long> {

    List<QuizAssignment> findByParticipantIdOrderByAssignedAtDesc(Long participantId);

    List<QuizAssignment> findByResearcherIdOrderByAssignedAtDesc(Long researcherId);

    List<QuizAssignment> findByQuestionnaireIdOrderByAssignedAtDesc(Long questionnaireId);

    List<QuizAssignment> findByParticipantIdAndStatusOrderByAssignedAtDesc(Long participantId, QuizAssignment.AssignmentStatus status);

    List<QuizAssignment> findByResearcherIdAndStatusOrderByAssignedAtDesc(Long researcherId, QuizAssignment.AssignmentStatus status);

    @Query("SELECT qa FROM QuizAssignment qa WHERE qa.participant.id = :participantId AND qa.questionnaire.id = :questionnaireId")
    Optional<QuizAssignment> findByParticipantIdAndQuestionnaireId(
            @Param("participantId") Long participantId,
            @Param("questionnaireId") Long questionnaireId
    );

    @Query("SELECT qa FROM QuizAssignment qa WHERE qa.status = :status AND qa.dueDate < :currentDate")
    List<QuizAssignment> findOverdueAssignments(
            @Param("status") QuizAssignment.AssignmentStatus status,
            @Param("currentDate") LocalDateTime currentDate
    );

    @Query("SELECT COUNT(qa) FROM QuizAssignment qa WHERE qa.participant.id = :participantId AND qa.status = :status")
    Long countByParticipantIdAndStatus(
            @Param("participantId") Long participantId,
            @Param("status") QuizAssignment.AssignmentStatus status
    );

    @Query("SELECT COUNT(qa) FROM QuizAssignment qa WHERE qa.researcher.id = :researcherId AND qa.status = :status")
    Long countByResearcherIdAndStatus(
            @Param("researcherId") Long researcherId,
            @Param("status") QuizAssignment.AssignmentStatus status
    );

    @Query("SELECT qa FROM QuizAssignment qa WHERE qa.study.id = :studyId ORDER BY qa.assignedAt DESC")
    List<QuizAssignment> findByStudyId(@Param("studyId") Long studyId);

    boolean existsByParticipantIdAndQuestionnaireId(Long participantId, Long questionnaireId);

    List<QuizAssignment> findByStudyIdAndParticipantIdOrderByAssignedAtDesc(Long studyId, Long participantId);

    boolean existsByStudyIdAndParticipantIdAndStatusAndPassed(
            Long studyId,
            Long participantId,
            QuizAssignment.AssignmentStatus status,
            Boolean passed);
    
    @Query("SELECT qa FROM QuizAssignment qa WHERE qa.study.id = :studyId AND qa.participant.id = :participantId AND qa.status = :status")
    Optional<QuizAssignment> findByStudyIdAndParticipantIdAndStatus(
            @Param("studyId") Long studyId,
            @Param("participantId") Long participantId,
            @Param("status") QuizAssignment.AssignmentStatus status
    );
    
    @Query("SELECT qa FROM QuizAssignment qa WHERE qa.study.id = :studyId AND qa.participant.id = :participantId AND qa.status = :status ORDER BY qa.completedAt DESC LIMIT 1")
    Optional<QuizAssignment> findTopByStudyIdAndParticipantIdAndStatusOrderByCompletedAtDesc(
            @Param("studyId") Long studyId,
            @Param("participantId") Long participantId,
            @Param("status") QuizAssignment.AssignmentStatus status
    );
}
