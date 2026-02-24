package com.artifactcomparator.service;

import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.Study.StudyStatus;
import com.artifactcomparator.repository.StudyRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled service to automatically transition study statuses based on dates
 */
@Service
@Slf4j
public class StudyStatusScheduler {

    private final StudyRepository studyRepository;

    public StudyStatusScheduler(StudyRepository studyRepository) {
        this.studyRepository = studyRepository;
    }

    /**
     * Runs every 5 minutes to check and update study statuses
     * - DRAFT → ACTIVE when start date arrives
     * - ACTIVE → COMPLETED when end date passes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 milliseconds
    @Transactional
    public void updateStudyStatuses() {
        LocalDate today = LocalDate.now();
        
        // Activate studies whose start date has arrived
        List<Study> studiesToActivate = studyRepository.findByStatusAndStartDateBefore(
            StudyStatus.DRAFT, today.plusDays(1) // Include today
        );
        
        for (Study study : studiesToActivate) {
            log.info("Auto-activating study: {} (ID: {}) - Start date: {}", 
                study.getTitle(), study.getId(), study.getStartDate());
            study.setStatus(StudyStatus.ACTIVE);
            studyRepository.save(study);
        }
        
        // Complete studies whose end date has passed
        List<Study> studiesToComplete = studyRepository.findByStatusAndEndDateBefore(
            StudyStatus.ACTIVE, today
        );
        
        for (Study study : studiesToComplete) {
            log.info("Auto-completing study: {} (ID: {}) - End date: {}", 
                study.getTitle(), study.getId(), study.getEndDate());
            study.setStatus(StudyStatus.COMPLETED);
            studyRepository.save(study);
        }
        
        if (!studiesToActivate.isEmpty() || !studiesToComplete.isEmpty()) {
            log.info("Study status update complete: {} activated, {} completed", 
                studiesToActivate.size(), studiesToComplete.size());
        }
    }
}
