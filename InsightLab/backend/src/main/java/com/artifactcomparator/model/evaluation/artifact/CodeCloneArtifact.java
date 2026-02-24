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
@Table(name = "code_clone_artifacts")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "id")
public class CodeCloneArtifact extends EvaluationArtifact {

    @Column(name = "code_snippet_1", nullable = false, columnDefinition = "TEXT")
    private String codeSnippet1;

    @Column(name = "code_snippet_2", nullable = false, columnDefinition = "TEXT")
    private String codeSnippet2;

    @Column(length = 50)
    private String language;

    @Column(name = "correct_clone_type", length = 50)
    private String correctCloneType;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Type(JsonType.class)
    @Column(name = "additional_data", columnDefinition = "jsonb")
    private JsonNode additionalData;
}
