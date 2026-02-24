package com.artifactcomparator.model.evaluation;

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
@Table(name = "evaluation_annotations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationAnnotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private ParticipantTaskAssignment assignment;

    @Column(name = "artifact_id")
    private UUID artifactId;

    @Column(name = "panel_number")
    private Integer panelNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "annotation_type")
    private AnnotationType annotationType = AnnotationType.HIGHLIGHT;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "start_line")
    private Integer startLine;

    @Column(name = "end_line")
    private Integer endLine;

    @Column(name = "start_offset")
    private Integer startOffset;

    @Column(name = "end_offset")
    private Integer endOffset;

    @Column(length = 20)
    private String color;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode tags;

    @Column(name = "created_at")
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

    public enum AnnotationType {
        HIGHLIGHT,
        NOTE,
        TAG
    }
}
