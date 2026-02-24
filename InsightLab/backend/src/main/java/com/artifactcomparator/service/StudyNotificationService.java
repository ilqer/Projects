package com.artifactcomparator.service;

import com.artifactcomparator.model.*;
import com.artifactcomparator.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudyNotificationService {

    private final StudyRepository studyRepository;
    private final StudyEnrollmentRepository enrollmentRepository;
    private final ReviewerAssignmentRepository reviewerAssignmentRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    /**
     * Bitimine 1 gün kalan tüm aktif studyler için bildirim gönderir
     */
    @Transactional
    public void sendDeadlineReminders() {
        log.info("Checking for studies with approaching deadlines...");
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        // Yarın biten ACTIVE studyleri bul
        List<Study> studiesEndingTomorrow = studyRepository.findByStatusAndEndDateBefore(
            Study.StudyStatus.ACTIVE, 
            tomorrow.plusDays(1) // endDate <= tomorrow
        ).stream()
         .filter(study -> study.getEndDate() != null && study.getEndDate().equals(tomorrow))
         .collect(Collectors.toList());
        
        log.info("Found {} studies ending tomorrow", studiesEndingTomorrow.size());
        
        for (Study study : studiesEndingTomorrow) {
            try {
                // Daha önce bildirim gönderilmiş mi kontrol et
                if (hasDeadlineNotificationBeenSent(study.getId())) {
                    log.debug("Deadline notification already sent for study: {}", study.getId());
                    continue;
                }
                
                sendDeadlineNotificationsForStudy(study);
                log.info("Sent deadline notifications for study: {} - {}", 
                         study.getId(), study.getTitle());
            } catch (Exception e) {
                log.error("Error sending deadline notifications for study: {}", 
                         study.getId(), e);
            }
        }
    }

    /**
     * Belirli bir study için tüm participant ve reviewer'lara bildirim gönderir
     */
    private void sendDeadlineNotificationsForStudy(Study study) {
        String formattedDate = study.getEndDate().format(
            DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("tr", "TR"))
        );
        
        // Participant'lara bildirim gönder
        sendDeadlineNotificationsToParticipants(study, formattedDate);
        
        // Reviewer'lara bildirim gönder
        sendDeadlineNotificationsToReviewers(study, formattedDate);
    }

    /**
     * Study'deki tüm participant'lara bildirim gönderir
     */
    private void sendDeadlineNotificationsToParticipants(Study study, String formattedDate) {
        List<StudyEnrollment> enrollments = enrollmentRepository.findByStudyId(study.getId());
        
        // Sadece aktif participant'ları filtrele
        List<StudyEnrollment> activeEnrollments = enrollments.stream()
            .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.ENROLLED ||
                        e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS)
            .collect(Collectors.toList());
        
        log.info("Sending deadline notifications to {} participants for study: {}", 
                 activeEnrollments.size(), study.getId());
        
        for (StudyEnrollment enrollment : activeEnrollments) {
            try {
                String title = "📅 Study Deadline Reminder";
                String message = String.format(
                    "The study '%s' you are participating in will end tomorrow (%s).\n\n" +
                    "Please make sure you have completed all your evaluations.",
                    study.getTitle(),
                    formattedDate
                );
                
                notificationService.createNotification(
                    enrollment.getParticipant(),  // recipient
                    study.getResearcher(),         // sender
                    Notification.NotificationType.DEADLINE_REMINDER,
                    title,
                    message,
                    Notification.RelatedEntityType.STUDY,
                    study.getId()
                );
                
                log.debug("Sent deadline notification to participant: {} for study: {}", 
                         enrollment.getParticipant().getId(), study.getId());
            } catch (Exception e) {
                log.error("Error sending notification to participant: {} for study: {}", 
                         enrollment.getParticipant().getId(), study.getId(), e);
            }
        }
    }

    /**
     * Study'deki tüm reviewer'lara bildirim gönderir
     */
    private void sendDeadlineNotificationsToReviewers(Study study, String formattedDate) {
        List<ReviewerAssignment> assignments = reviewerAssignmentRepository.findByStudyIdOrderByAssignedAtDesc(study.getId());
        
        // Sadece kabul edilmiş reviewer'ları filtrele
        List<ReviewerAssignment> activeAssignments = assignments.stream()
            .filter(a -> a.getStatus() == ReviewerAssignment.AssignmentStatus.ACCEPTED ||
                        a.getStatus() == ReviewerAssignment.AssignmentStatus.IN_PROGRESS)
            .collect(Collectors.toList());
        
        log.info("Sending deadline notifications to {} reviewers for study: {}", 
                 activeAssignments.size(), study.getId());
        
        for (ReviewerAssignment assignment : activeAssignments) {
            try {
                int pendingReviews = assignment.getTotalEvaluations() - assignment.getReviewedEvaluations();
                
                String title = "📅 Review Deadline Reminder";
                String message = String.format(
                    "The study '%s' you are reviewing will end tomorrow (%s).\n\n" +
                    "Pending reviews: %d\n" +
                    "Completed reviews: %d / %d\n\n" +
                    "Please make sure you have completed all reviews.",
                    study.getTitle(),
                    formattedDate,
                    pendingReviews,
                    assignment.getReviewedEvaluations(),
                    assignment.getTotalEvaluations()
                );
                
                notificationService.createNotification(
                    assignment.getReviewer(),      // recipient
                    study.getResearcher(),         // sender
                    Notification.NotificationType.DEADLINE_REMINDER,
                    title,
                    message,
                    Notification.RelatedEntityType.STUDY,
                    study.getId()
                );
                
                log.debug("Sent deadline notification to reviewer: {} for study: {}", 
                         assignment.getReviewer().getId(), study.getId());
            } catch (Exception e) {
                log.error("Error sending notification to reviewer: {} for study: {}", 
                         assignment.getReviewer().getId(), study.getId(), e);
            }
        }
    }

    /**
     * Bu study için daha önce deadline notification gönderilmiş mi kontrol eder
     */
    private boolean hasDeadlineNotificationBeenSent(Long studyId) {
        // Bugün gönderilen DEADLINE_REMINDER tipindeki bildirimleri kontrol et
        LocalDate today = LocalDate.now();
        
        List<Notification> todayNotifications = notificationRepository.findAll().stream()
            .filter(n -> n.getType() == Notification.NotificationType.DEADLINE_REMINDER)
            .filter(n -> n.getRelatedEntityType() == Notification.RelatedEntityType.STUDY)
            .filter(n -> n.getRelatedEntityId() != null && n.getRelatedEntityId().equals(studyId))
            .filter(n -> n.getSentAt() != null && n.getSentAt().toLocalDate().equals(today))
            .collect(Collectors.toList());
        
        return !todayNotifications.isEmpty();
    }

    /**
     * Manuel olarak bir study için deadline bildirimi gönderir
     * (Test veya acil durum için kullanılabilir)
     */
    @Transactional
    public void sendDeadlineNotificationForStudy(Long studyId) {
        Study study = studyRepository.findById(studyId)
            .orElseThrow(() -> new IllegalArgumentException("Study not found: " + studyId));
        
        if (study.getStatus() != Study.StudyStatus.ACTIVE) {
            throw new IllegalStateException("Study must be ACTIVE to send deadline notifications");
        }
        
        if (study.getEndDate() == null) {
            throw new IllegalStateException("Study must have an end date");
        }
        
        String formattedDate = study.getEndDate().format(
            DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("tr", "TR"))
        );
        
        sendDeadlineNotificationsForStudy(study);
        log.info("Manually sent deadline notifications for study: {}", studyId);
    }
}