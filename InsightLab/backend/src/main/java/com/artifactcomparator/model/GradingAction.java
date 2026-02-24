package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "grading_actions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private QuizSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_answer_id")
    private QuestionAnswer questionAnswer; // NULL for overall submission grading

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grader_id", nullable = false)
    private User grader;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "points_before")
    private Double pointsBefore;

    @Column(name = "points_after")
    private Double pointsAfter;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String notes; // Internal notes from grader

    @Column(name = "graded_at", nullable = false, updatable = false)
    private LocalDateTime gradedAt;

    @PrePersist
    protected void onCreate() {
        if (gradedAt == null) {
            gradedAt = LocalDateTime.now();
        }
    }

    public enum ActionType {
        AUTO_GRADE,        // Automatic grading performed
        MANUAL_GRADE,      // Manual grading performed
        GRADE_ADJUSTMENT,  // Score adjustment after initial grading
        FEEDBACK_ADDED,    // Feedback added to answer
        FINALIZED          // Grading finalized and returned to participant
    }
}
