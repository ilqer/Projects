package com.artifactcomparator.model.evaluation.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "bug_report_artifacts")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "id")
public class BugReportArtifact extends EvaluationArtifact {

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String severity;

    @Column(length = 50)
    private String priority;

    @Column(length = 255)
    private String reporter;

    @Column(name = "date_reported")
    private LocalDateTime dateReported;

    @Column(name = "correct_category", length = 100)
    private String correctCategory;

    @Column(name = "llm_suggested_category", length = 100)
    private String llmSuggestedCategory;

    @Type(JsonType.class)
    @Column(name = "additional_data", columnDefinition = "jsonb")
    private JsonNode additionalData;
}
