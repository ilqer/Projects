package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionnaire_id", nullable = false)
    private Questionnaire questionnaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "researcher_id", nullable = false)
    private User researcher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id")
    private Study study; // Optional: link to a specific study

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.PENDING;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "max_attempts")
    @Builder.Default
    private Integer maxAttempts = 1;

    @Column(name = "attempts_taken")
    @Builder.Default
    private Integer attemptsTaken = 0;

    @Column(name = "allow_retake", nullable = false)
    @Builder.Default
    private Boolean allowRetake = false;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "declined_at")
    private LocalDateTime declinedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "score")
    private Double score; // Final score in percentage

    @Column(name = "passed")
    private Boolean passed; // Whether the participant passed based on threshold
    
    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private ParticipantLevel level; // Participant level for competency quizzes

    @Column(columnDefinition = "TEXT")
    private String notes; // Optional notes from researcher

    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason; // Reason for declining (optional)

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }

    public enum AssignmentStatus {
        PENDING,      // Invitation sent, awaiting response
        ACCEPTED,     // Participant accepted the invitation
        DECLINED,     // Participant declined the invitation
        IN_PROGRESS,  // Participant started the quiz
        COMPLETED,    // Participant completed the quiz
        EXPIRED       // Due date passed without completion
    }

    public void accept() {
        this.status = AssignmentStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    public void decline(String reason) {
        this.status = AssignmentStatus.DECLINED;
        this.declinedAt = LocalDateTime.now();
        this.declineReason = reason;
    }

    public void startQuiz() {
        if (this.status == AssignmentStatus.ACCEPTED) {
            this.status = AssignmentStatus.IN_PROGRESS;
        }
    }

    public void complete(Double score, Boolean passed) {
        this.status = AssignmentStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
        this.score = score;
        this.passed = passed;
        this.attemptsTaken++;
    }

    public boolean canRetake() {
        return allowRetake &&
               status == AssignmentStatus.COMPLETED &&
               (maxAttempts == null || attemptsTaken < maxAttempts);
    }

    public boolean isOverdue() {
        return dueDate != null &&
               LocalDateTime.now().isAfter(dueDate) &&
               status != AssignmentStatus.COMPLETED;
    }
}
