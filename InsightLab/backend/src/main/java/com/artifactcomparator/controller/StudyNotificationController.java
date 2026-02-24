package com.artifactcomparator.controller;

import com.artifactcomparator.dto.MessageResponse;
import com.artifactcomparator.service.StudyNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Study deadline notification test endpoint'i
 * Sadece admin ve researcher kullanabilir
 * Production'da bu controller'ı kaldırabilir veya sadece admin'e açabilirsiniz
 */
@RestController
@RequestMapping("/api/studies/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class StudyNotificationController {

    private final StudyNotificationService studyNotificationService;

    /**
     * Manuel olarak tüm deadline hatırlatıcılarını tetikler
     * Test için kullanılabilir
     */
    @PostMapping("/deadline-reminders/trigger")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESEARCHER')")
    public ResponseEntity<MessageResponse> triggerDeadlineReminders() {
        try {
            studyNotificationService.sendDeadlineReminders();
            return ResponseEntity.ok(
                new MessageResponse("Deadline reminders sent successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Error sending deadline reminders: " + e.getMessage())
            );
        }
    }

    /**
     * Belirli bir study için manuel olarak deadline bildirimi gönderir
     */
    @PostMapping("/deadline-reminders/study/{studyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESEARCHER')")
    public ResponseEntity<MessageResponse> sendDeadlineNotificationForStudy(
            @PathVariable Long studyId
    ) {
        try {
            studyNotificationService.sendDeadlineNotificationForStudy(studyId);
            return ResponseEntity.ok(
                new MessageResponse("Deadline notifications sent for study: " + studyId)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Study not found: " + studyId)
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(
                new MessageResponse(e.getMessage())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                new MessageResponse("Error: " + e.getMessage())
            );
        }
    }
}