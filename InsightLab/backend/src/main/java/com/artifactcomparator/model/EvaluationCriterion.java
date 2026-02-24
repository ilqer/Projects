package com.artifactcomparator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_criteria")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCriterion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;
    
    @NotBlank(message = "Criterion name is required")
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RatingFormat ratingFormat = RatingFormat.FIVE_STAR;
    
    @Column(name = "rating_options", columnDefinition = "TEXT")
    private String ratingOptions; // JSON or comma-separated values for custom options
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum RatingFormat {
        FIVE_STAR,           // 1-5 stars
        TEN_POINT,           // 1-10 scale
        BINARY,              // Yes/No
        MULTIPLE_CHOICE,     // Custom options
        TEXT                 // Free text response
    }
}
