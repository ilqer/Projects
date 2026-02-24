package com.artifactcomparator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questionnaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Questionnaire {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Questionnaire title is required")
    @Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionnaireType type;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "researcher_id", nullable = false)
    private User researcher;
    
    @OneToMany(mappedBy = "questionnaire", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Question> questions = new ArrayList<>();
    
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    // UC4-2: Scoring and Timing Configuration
    @Column(name = "passing_threshold")
    private Double passingThreshold; // Percentage (0-100)
    
    @Column(name = "intermediate_threshold")
    private Double intermediateThreshold; // Percentage (0-100)
    
    @Column(name = "advanced_threshold")
    private Double advancedThreshold; // Percentage (0-100)
    
    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes; // Time limit in minutes, null = no limit
    
    @Column(name = "total_points")
    private Integer totalPoints; // Calculated from all questions
    
    @Column(name = "show_correct_answers")
    @Builder.Default
    private Boolean showCorrectAnswers = true; // Show correct answers after submission
    
    @Column(name = "randomize_questions")
    @Builder.Default
    private Boolean randomizeQuestions = false; // Randomize question order
    
    @Column(name = "randomize_options")
    @Builder.Default
    private Boolean randomizeOptions = false; // Randomize option order for MCQ
    
    @Column(name = "allow_review")
    @Builder.Default
    private Boolean allowReview = true; // Allow participants to review before submit
    
    @Column(name = "grading_method")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GradingMethod gradingMethod = GradingMethod.AUTOMATIC;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum QuestionnaireType {
        COMPETENCY,
        BACKGROUND
    }
    
    public enum GradingMethod {
        AUTOMATIC,      // Auto-grade based on correct answers
        MANUAL,         // Researcher manually grades
        PARTIAL_CREDIT  // Partial credit for partially correct answers
    }
    
    public void addQuestion(Question question) {
        questions.add(question);
        question.setQuestionnaire(this);
    }
    
    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setQuestionnaire(null);
    }
    
    public void calculateTotalPoints() {
        this.totalPoints = questions.stream()
                .mapToInt(Question::getPoints)
                .sum();
    }
}