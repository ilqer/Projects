package com.artifactcomparator.model.evaluation;

import com.artifactcomparator.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", unique = true)
    private ParticipantTaskAssignment assignment;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;

    @Column(name = "is_locked")
    private Boolean isLocked = true;

    @Type(JsonType.class)
    @Column(name = "submission_data", columnDefinition = "jsonb")
    private JsonNode submissionData;

    @Type(JsonType.class)
    @Column(name = "answers", columnDefinition = "jsonb")
    private JsonNode answers;

    @Type(JsonType.class)
    @Column(name = "annotations_snapshot", columnDefinition = "jsonb")
    private JsonNode annotationsSnapshot;

    @Type(JsonType.class)
    @Column(name = "validation_errors", columnDefinition = "jsonb")
    private JsonNode validationErrors;

    @Column(name = "snapshot_decision")
    private String snapshotDecision;

    @Column(name = "snapshot_explanation", columnDefinition = "TEXT")
    private String snapshotExplanation;

    @Column(name = "snapshot_confidence")
    private String snapshotConfidence;

    @Column(name = "clone_relationship")
    private String cloneRelationship;

    @Column(name = "clone_similarity")
    private Double cloneSimilarity;

    @Column(name = "clone_notes", columnDefinition = "TEXT")
    private String cloneNotes;

    @Column(name = "bug_severity")
    private String bugSeverity;

    @Column(name = "bug_reproducible")
    private String bugReproducible;

    @Column(name = "bug_category")
    private String bugCategory;

    @Column(name = "bug_notes", columnDefinition = "TEXT")
    private String bugNotes;

    @Column(name = "solid_violated_principle")
    private String solidViolatedPrinciple;

    @Column(name = "solid_violation_severity")
    private String solidViolationSeverity;

    @Column(name = "solid_explanation", columnDefinition = "TEXT")
    private String solidExplanation;

    @Column(name = "solid_suggested_fix", columnDefinition = "TEXT")
    private String solidSuggestedFix;

    @Enumerated(EnumType.STRING)
    @Column(name = "reviewer_status")
    private ReviewerStatus reviewerStatus;

    @Column(name = "reviewer_notes", columnDefinition = "TEXT")
    private String reviewerNotes;

    @Column(name = "reviewer_quality_score")
    private Integer reviewerQualityScore;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }

    public enum ReviewerStatus {
        VALID,
        SUSPICIOUS,
        INCOMPLETE
    }
}
