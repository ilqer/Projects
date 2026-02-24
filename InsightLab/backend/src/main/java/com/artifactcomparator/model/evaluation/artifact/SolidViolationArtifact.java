package com.artifactcomparator.model.evaluation.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "solid_violation_artifacts")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "id")
public class SolidViolationArtifact extends EvaluationArtifact {

    @Column(name = "code_snippet", nullable = false, columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(length = 50)
    private String language;

    @Column(name = "correct_violation_type", length = 50)
    private String correctViolationType;

    @Column(name = "llm_analysis", columnDefinition = "TEXT")
    private String llmAnalysis;

    @Column(name = "llm_suggested_fix", columnDefinition = "TEXT")
    private String llmSuggestedFix;

    @Column(name = "difficulty_level", length = 20)
    private String difficultyLevel;

    @Type(JsonType.class)
    @Column(name = "additional_data", columnDefinition = "jsonb")
    private JsonNode additionalData;
}
