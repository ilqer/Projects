package com.artifactcomparator.model.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_drafts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", unique = true)
    private ParticipantTaskAssignment assignment;

    @Type(JsonType.class)
    @Column(name = "draft_data", nullable = false, columnDefinition = "jsonb")
    private JsonNode draftData;

    @Column(name = "last_saved_at")
    private LocalDateTime lastSavedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        lastSavedAt = LocalDateTime.now();
    }
}
