package com.artifactcomparator.model.evaluation.artifact;

import com.artifactcomparator.model.evaluation.EvaluationTask;
import com.artifactcomparator.model.evaluation.TaskType;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evaluation_artifacts")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationArtifact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "artifact_type", nullable = false)
    private TaskType.ArtifactType artifactType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_task_id")
    private EvaluationTask evaluationTask;

    @Column(name = "panel_number")
    private Integer panelNumber = 1;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
