package com.artifactcomparator.model.evaluation;

import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.User;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "evaluation_tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_type_id")
    private TaskType taskType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id")
    private Study study;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.DRAFT;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "allow_highlight")
    private Boolean allowHighlight = Boolean.TRUE;

    @Column(name = "allow_annotation")
    private Boolean allowAnnotation = Boolean.FALSE;

    @Column(name = "allow_tagging")
    private Boolean allowTagging = Boolean.FALSE;

    @Enumerated(EnumType.STRING)
    @Column(name = "layout_mode")
    private LayoutMode layoutMode = LayoutMode.SINGLE;

    @Column(name = "blinded_mode")
    private Boolean blindedMode = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Type(JsonType.class)
    @Column(name = "artifact_references", columnDefinition = "jsonb")
    private List<ArtifactReference> artifacts;

    @Type(JsonType.class)
    @Column(name = "criteria_definitions", columnDefinition = "jsonb")
    private List<EvaluationCriterionDefinition> criteria;

    @Type(JsonType.class)
    @Column(name = "blinded_order", columnDefinition = "jsonb")
    private List<Integer> blindedOrder;

    @Column(name = "clone_original_code_content", columnDefinition = "TEXT")
    private String cloneOriginalCodeContent;

    @Column(name = "clone_clone_code_content", columnDefinition = "TEXT")
    private String cloneCloneCodeContent;

    @Column(name = "bug_report_json", columnDefinition = "TEXT")
    private String bugReportJson;

    @Column(name = "solid_json", columnDefinition = "TEXT")
    private String solidJson;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TaskStatus {
        DRAFT,
        ACTIVE,
        COMPLETED,
        ARCHIVED
    }

    public enum LayoutMode {
        SINGLE,
        SIDE_BY_SIDE,
        THREE_WAY
    }
}
