package com.artifactcomparator.dto;

import com.artifactcomparator.model.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private Long recipientId;
    private String recipientName;
    private Long senderId;
    private String senderName;
    private Notification.NotificationType type;
    private String title;
    private String message;
    private Boolean read;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private Notification.RelatedEntityType relatedEntityType;
    private Long relatedEntityId;
}
