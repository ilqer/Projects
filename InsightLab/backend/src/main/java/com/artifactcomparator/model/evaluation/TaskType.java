package com.artifactcomparator.model.evaluation;

import com.artifactcomparator.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "artifact_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ArtifactType artifactType;

    @Column(name = "layout_mode", nullable = false)
    @Enumerated(EnumType.STRING)
    private LayoutMode layoutMode;

    @Column(name = "comparison_mode", nullable = false)
    @Enumerated(EnumType.STRING)
    private ComparisonMode comparisonMode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum ArtifactType {
        BUG_REPORT,
        CODE_CLONE,
        SOLID_VIOLATION,
        SNAPSHOT
    }

    public enum LayoutMode {
        TWO_PANEL,
        THREE_PANEL,
        SINGLE_PANEL
    }

    public enum ComparisonMode {
        TEXTUAL,
        SEMANTIC,
        VISUAL
    }
}
