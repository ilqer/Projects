package com.artifactcomparator.controller;

import com.artifactcomparator.dto.MessageResponse;
import com.artifactcomparator.dto.NotificationDTO;
import com.artifactcomparator.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<List<NotificationDTO>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getUnreadNotifications());
    }

    @GetMapping("/read")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<List<NotificationDTO>> getReadNotifications() {
        return ResponseEntity.ok(notificationService.getReadNotifications());
    }

    @GetMapping("/unread/count")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<NotificationDTO> getNotificationById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getNotificationById(id));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/{id}/unread")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<NotificationDTO> markAsUnread(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsUnread(id));
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<MessageResponse> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<MessageResponse> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(new MessageResponse("Notification deleted successfully"));
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT', 'REVIEWER', 'ADMIN')")
    public ResponseEntity<MessageResponse> deleteAllNotifications() {
        notificationService.deleteAllNotifications();
        return ResponseEntity.ok(new MessageResponse("All notifications deleted successfully"));
    }
}
