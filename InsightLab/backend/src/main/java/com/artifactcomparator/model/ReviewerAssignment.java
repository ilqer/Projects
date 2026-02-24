package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviewer_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewerAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy; // Researcher who assigned

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.PENDING;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "declined_at")
    private LocalDateTime declinedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "decline_reason", length = 500)
    private String declineReason;

    @Column(name = "reviewer_notes", length = 2000)
    private String reviewerNotes;

    // Statistics
    @Column(name = "total_evaluations")
    @Builder.Default
    private Integer totalEvaluations = 0;

    @Column(name = "reviewed_evaluations")
    @Builder.Default
    private Integer reviewedEvaluations = 0;

    @Column(name = "accepted_evaluations")
    @Builder.Default
    private Integer acceptedEvaluations = 0;

    @Column(name = "rejected_evaluations")
    @Builder.Default
    private Integer rejectedEvaluations = 0;

    @Column(name = "flagged_evaluations")
    @Builder.Default
    private Integer flaggedEvaluations = 0;

    @PrePersist
    protected void onCreate() {
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }

    public enum AssignmentStatus {
        PENDING,      // Reviewer henüz kabul etmedi
        ACCEPTED,     // Reviewer kabul etti, review yapabilir
        DECLINED,     // Reviewer reddetti
        IN_PROGRESS,  // Review'lere başladı
        COMPLETED     // Tüm review'ler tamamlandı
    }

    public void accept() {
        if (this.status != AssignmentStatus.PENDING) {
            throw new IllegalStateException("Can only accept pending assignments");
        }
        this.status = AssignmentStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    public void decline(String reason) {
        if (this.status != AssignmentStatus.PENDING) {
            throw new IllegalStateException("Can only decline pending assignments");
        }
        this.status = AssignmentStatus.DECLINED;
        this.declinedAt = LocalDateTime.now();
        this.declineReason = reason;
    }

    public void startReviewing() {
        if (this.status == AssignmentStatus.ACCEPTED) {
            this.status = AssignmentStatus.IN_PROGRESS;
        }
    }

    public void markAsCompleted() {
        if (this.status == AssignmentStatus.IN_PROGRESS) {
            this.status = AssignmentStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        }
    }

    public void incrementReviewedCount() {
        this.reviewedEvaluations++;
    }

    public void incrementAcceptedCount() {
        this.acceptedEvaluations++;
    }

    public void incrementRejectedCount() {
        this.rejectedEvaluations++;
    }

    public void incrementFlaggedCount() {
        this.flaggedEvaluations++;
    }

    public Integer getProgressPercentage() {
        if (totalEvaluations == null || totalEvaluations == 0) {
            return 0;
        }
        return (reviewedEvaluations * 100) / totalEvaluations;
    }
}