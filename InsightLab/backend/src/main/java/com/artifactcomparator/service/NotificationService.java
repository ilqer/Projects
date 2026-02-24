package com.artifactcomparator.service;

import com.artifactcomparator.dto.NotificationDTO;
import com.artifactcomparator.model.Notification;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.NotificationRepository;
import com.artifactcomparator.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationDTO createNotification(
            User recipient,
            User sender,
            Notification.NotificationType type,
            String title,
            String message,
            Notification.RelatedEntityType relatedEntityType,
            Long relatedEntityId
    ) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getMyNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientIdOrderBySentAtDesc(currentUser.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientIdAndReadOrderBySentAtDesc(currentUser.getId(), false)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getReadNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientIdAndReadOrderBySentAtDesc(currentUser.getId(), true)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countUnreadByRecipientId(currentUser.getId());
    }

    @Transactional
    public NotificationDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        User currentUser = getCurrentUser();
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only mark your own notifications as read");
        }

        notification.markAsRead();
        Notification updated = notificationRepository.save(notification);
        return convertToDTO(updated);
    }

    @Transactional
    public NotificationDTO markAsUnread(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        User currentUser = getCurrentUser();
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only mark your own notifications as unread");
        }

        notification.markAsUnread();
        Notification updated = notificationRepository.save(notification);
        return convertToDTO(updated);
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        List<Notification> unreadNotifications = notificationRepository
                .findByRecipientIdAndReadOrderBySentAtDesc(currentUser.getId(), false);

        unreadNotifications.forEach(Notification::markAsRead);
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        User currentUser = getCurrentUser();
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only delete your own notifications");
        }

        notificationRepository.delete(notification);
    }

    @Transactional
    public void deleteAllNotifications() {
        User currentUser = getCurrentUser();
        notificationRepository.deleteByRecipientId(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public NotificationDTO getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        User currentUser = getCurrentUser();
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only view your own notifications");
        }

        return convertToDTO(notification);
    }

    // Helper methods

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .recipientName(notification.getRecipient().getFullName())
                .senderId(notification.getSender() != null ? notification.getSender().getId() : null)
                .senderName(notification.getSender() != null ? notification.getSender().getFullName() : null)
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.getRead())
                .sentAt(notification.getSentAt())
                .readAt(notification.getReadAt())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
}
