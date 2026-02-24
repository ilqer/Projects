package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_artifacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyArtifact {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artifact_id", nullable = false)
    private Artifact artifact;
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "display_label")
    private String displayLabel; // Optional label for the artifact (e.g., "Version A", "Option 1")
    
    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;
    
    @PrePersist
    protected void onAdd() {
        addedAt = LocalDateTime.now();
    }
}
