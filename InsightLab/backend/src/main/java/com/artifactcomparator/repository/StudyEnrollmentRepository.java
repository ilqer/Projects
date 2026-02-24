package com.artifactcomparator.repository;

import com.artifactcomparator.model.StudyEnrollment;
import com.artifactcomparator.model.StudyEnrollment.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyEnrollmentRepository extends JpaRepository<StudyEnrollment, Long> {
    
    List<StudyEnrollment> findByParticipantId(Long participantId);
    
    List<StudyEnrollment> findByParticipantIdAndStatus(Long participantId, EnrollmentStatus status);
    
    List<StudyEnrollment> findByStudyId(Long studyId);

    List<StudyEnrollment> findByStudyIdIn(List<Long> studyIds);
    
    Optional<StudyEnrollment> findByStudyIdAndParticipantId(Long studyId, Long participantId);
}
