package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "participant_evaluation_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantEvaluationReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_assignment_id", nullable = false)
    private ReviewerAssignment reviewerAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    // Participant'ın değerlendirdiği artifact bilgileri
    @Column(name = "participant_code")
    private String participantCode; // Anonim kod (P-00123)

    @Column(name = "artifacts_evaluated")
    private Integer artifactsEvaluated;

    @Column(name = "evaluation_time_minutes")
    private Integer evaluationTimeMinutes;

    @Column(name = "completeness_percentage")
    private Integer completenessPercentage;

    // Reviewer'ın verdiği karar
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReviewDecision decision = ReviewDecision.PENDING;

    // Quality ratings (1-5)
    @Column(name = "quality_rating")
    private Integer qualityRating; // Genel kalite

    @Column(name = "consistency_rating")
    private Integer consistencyRating; // Tutarlılık

    @Column(name = "completeness_rating")
    private Integer completenessRating; // Eksiksizlik

    // Issues found
    @ElementCollection
    @CollectionTable(name = "evaluation_review_issues", 
                     joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "issue")
    @Builder.Default
    private List<String> issuesFound = new ArrayList<>();

    @Column(name = "reviewer_comments", length = 2000)
    private String reviewerComments;

    @Column(name = "flag_reason", length = 1000)
    private String flagReason; // Flag durumunda neden

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum ReviewDecision {
        PENDING,    // Henüz review edilmedi
        ACCEPTED,   // Evaluation kabul edildi, kaliteli
        REJECTED,   // Evaluation reddedildi, yetersiz
        FLAGGED     // Şüpheli, detaylı inceleme gerekiyor
    }

    public void accept(Integer qualityRating, Integer consistencyRating, 
                      Integer completenessRating, String comments) {
        this.decision = ReviewDecision.ACCEPTED;
        this.qualityRating = qualityRating;
        this.consistencyRating = consistencyRating;
        this.completenessRating = completenessRating;
        this.reviewerComments = comments;
        this.reviewedAt = LocalDateTime.now();
    }

    public void reject(Integer qualityRating, Integer consistencyRating,
                      Integer completenessRating, List<String> issues, String comments) {
        this.decision = ReviewDecision.REJECTED;
        this.qualityRating = qualityRating;
        this.consistencyRating = consistencyRating;
        this.completenessRating = completenessRating;
        this.issuesFound = issues;
        this.reviewerComments = comments;
        this.reviewedAt = LocalDateTime.now();
    }

    public void flag(String reason, List<String> issues, String comments) {
        this.decision = ReviewDecision.FLAGGED;
        this.flagReason = reason;
        this.issuesFound = issues;
        this.reviewerComments = comments;
        this.reviewedAt = LocalDateTime.now();
    }

    public Double getAverageRating() {
        if (qualityRating == null || consistencyRating == null || completenessRating == null) {
            return null;
        }
        return (qualityRating + consistencyRating + completenessRating) / 3.0;
    }
}