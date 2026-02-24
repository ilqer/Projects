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
@Table(name = "question_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private QuizSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText; // For short answer questions

    @Column(name = "selected_option_ids", columnDefinition = "TEXT")
    private String selectedOptionIds; // Comma-separated option IDs for MCQ

    @Column(name = "is_correct")
    private Boolean isCorrect; // Auto-graded result

    @Column(name = "points_earned")
    private Double pointsEarned; // Points awarded (can be partial)

    @Column(name = "points_possible", nullable = false)
    private Integer pointsPossible; // Max points for this question

    @Column(name = "requires_manual_grading", nullable = false)
    @Builder.Default
    private Boolean requiresManualGrading = false;

    @Column(name = "answered_at", nullable = false, updatable = false)
    private LocalDateTime answeredAt;

    @OneToMany(mappedBy = "questionAnswer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GradingFeedback> feedbackList = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (answeredAt == null) {
            answeredAt = LocalDateTime.now();
        }
        if (pointsPossible == null && question != null) {
            pointsPossible = question.getPoints();
        }
    }

    public void addFeedback(GradingFeedback feedback) {
        feedbackList.add(feedback);
        feedback.setQuestionAnswer(this);
    }

    public void removeFeedback(GradingFeedback feedback) {
        feedbackList.remove(feedback);
        feedback.setQuestionAnswer(null);
    }

    // Helper method to get selected option IDs as a list
    public List<Long> getSelectedOptionIdList() {
        if (selectedOptionIds == null || selectedOptionIds.trim().isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> ids = new ArrayList<>();
        for (String id : selectedOptionIds.split(",")) {
            try {
                ids.add(Long.parseLong(id.trim()));
            } catch (NumberFormatException e) {
                // Skip invalid IDs
            }
        }
        return ids;
    }

    // Helper method to set selected option IDs from a list
    public void setSelectedOptionIdList(List<Long> optionIds) {
        if (optionIds == null || optionIds.isEmpty()) {
            this.selectedOptionIds = null;
        } else {
            this.selectedOptionIds = String.join(",", optionIds.stream()
                    .map(String::valueOf)
                    .toArray(String[]::new));
        }
    }
}
