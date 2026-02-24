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
@Table(name = "quiz_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_assignment_id", nullable = false)
    private QuizAssignment quizAssignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionnaire_id", nullable = false)
    private Questionnaire questionnaire;

    @Column(name = "attempt_number", nullable = false)
    @Builder.Default
    private Integer attemptNumber = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.IN_PROGRESS;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @Column(name = "auto_score")
    private Double autoScore; // Auto-graded score (0-100)

    @Column(name = "manual_score")
    private Double manualScore; // Manually adjusted score (0-100)

    @Column(name = "final_score")
    private Double finalScore; // Final score after grading (0-100)

    @Column(name = "total_points_earned")
    private Integer totalPointsEarned; // Raw points earned

    @Column(name = "total_points_possible")
    private Integer totalPointsPossible; // Total points possible

    @Column(name = "passed")
    private Boolean passed; // Whether the submission passed based on threshold

    @Column(name = "requires_manual_grading", nullable = false)
    @Builder.Default
    private Boolean requiresManualGrading = false;

    @Column(name = "time_taken_minutes")
    private Integer timeTakenMinutes; // Actual time taken

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionAnswer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GradingAction> gradingActions = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }

    public enum SubmissionStatus {
        IN_PROGRESS,  // Participant is taking the quiz
        SUBMITTED,    // Participant submitted, pending grading
        GRADED,       // Grading complete (auto or manual)
        RETURNED      // Results returned to participant
    }

    public void submit() {
        this.status = SubmissionStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();

        // Calculate time taken if time limit was set
        if (startedAt != null && submittedAt != null) {
            long minutes = java.time.Duration.between(startedAt, submittedAt).toMinutes();
            this.timeTakenMinutes = (int) minutes;
        }
    }

    public void markAsGraded() {
        this.status = SubmissionStatus.GRADED;
        this.gradedAt = LocalDateTime.now();
    }

    public void returnToParticipant() {
        if (this.status == SubmissionStatus.GRADED) {
            this.status = SubmissionStatus.RETURNED;
        }
    }

    public void calculateFinalScore() {
        // Use manual score if available, otherwise use auto score
        if (manualScore != null) {
            this.finalScore = manualScore;
        } else {
            this.finalScore = autoScore;
        }

        // Determine if passed based on passing threshold
        if (finalScore != null && questionnaire.getPassingThreshold() != null) {
            this.passed = finalScore >= questionnaire.getPassingThreshold();
        }
    }

    public void addAnswer(QuestionAnswer answer) {
        answers.add(answer);
        answer.setSubmission(this);
    }

    public void removeAnswer(QuestionAnswer answer) {
        answers.remove(answer);
        answer.setSubmission(null);
    }

    public void addGradingAction(GradingAction action) {
        gradingActions.add(action);
        action.setSubmission(this);
    }

    public boolean isOverTime() {
        if (questionnaire.getTimeLimitMinutes() == null || timeTakenMinutes == null) {
            return false;
        }
        return timeTakenMinutes > questionnaire.getTimeLimitMinutes();
    }
}
