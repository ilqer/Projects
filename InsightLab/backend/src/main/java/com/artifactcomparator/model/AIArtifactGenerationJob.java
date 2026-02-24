package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_artifact_generation_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIArtifactGenerationJob {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "researcher_id", nullable = false)
    private User researcher;
    
    @Column(nullable = false)
    private String description;
    
    @Column(name = "programming_language", nullable = false)
    private String programmingLanguage;
    
    @Column(nullable = false)
    private String complexity;
    
    @Column(name = "include_comments")
    private Boolean includeComments;
    
    @Column(name = "follow_best_practices")
    private Boolean followBestPractices;
    
    @Column(name = "add_error_handling")
    private Boolean addErrorHandling;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = JobStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum JobStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}
