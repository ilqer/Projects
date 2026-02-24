package com.artifactcomparator.repository;

import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.Study.StudyStatus;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudyRepository extends JpaRepository<Study, Long> {
    
    List<Study> findByResearcher(User researcher);
    
    List<Study> findByResearcherId(Long researcherId);
    
    List<Study> findByStatus(StudyStatus status);
    
    List<Study> findByResearcherAndStatus(User researcher, StudyStatus status);
    
    List<Study> findByResearcherIdAndStatus(Long researcherId, StudyStatus status);
    
    // Exclude archived studies from active lists
    List<Study> findByResearcherIdAndStatusNot(Long researcherId, StudyStatus status);

    // For automatic status transitions
    List<Study> findByStatusAndStartDateBefore(StudyStatus status, LocalDate date);
    
    List<Study> findByStatusAndEndDateBefore(StudyStatus status, LocalDate date);
}

