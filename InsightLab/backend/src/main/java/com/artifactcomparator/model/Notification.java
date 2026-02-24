package com.artifactcomparator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @NotBlank(message = "Notification title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "read_status", nullable = false)
    @Builder.Default
    private Boolean read = false;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Reference to related entities (for navigation)
    @Column(name = "related_entity_type")
    @Enumerated(EnumType.STRING)
    private RelatedEntityType relatedEntityType;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }

    public enum NotificationType {
        TASK_ASSIGNED,
        DEADLINE_REMINDER,
        STUDY_INVITATION,
        REVIEW_ASSIGNED,
        SYSTEM_ALERT,
        QUIZ_INVITATION,
        QUIZ_INVITATION_ACCEPTED,
        QUIZ_INVITATION_DECLINED,
        QUIZ_GRADED,
        EVALUATION_TASK_ASSIGNED,
        EVALUATION_TASK_COMPLETED
    }

    public enum RelatedEntityType {
        STUDY,
        QUESTIONNAIRE,
        ARTIFACT,
        QUIZ_ASSIGNMENT,
        REVIEW,
        EVALUATION_TASK
    }

    public void markAsRead() {
        this.read = true;
        this.readAt = LocalDateTime.now();
    }

    public void markAsUnread() {
        this.read = false;
        this.readAt = null;
    }
}
