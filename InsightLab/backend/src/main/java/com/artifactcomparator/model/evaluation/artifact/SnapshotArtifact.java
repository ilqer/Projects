package com.artifactcomparator.model.evaluation.artifact;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.util.UUID;

@Entity
@Table(name = "snapshot_artifacts")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@PrimaryKeyJoinColumn(name = "id")
public class SnapshotArtifact extends EvaluationArtifact {

    @Column(name = "reference_image_id")
    private UUID referenceImageId;

    @Column(name = "failure_image_id")
    private UUID failureImageId;

    @Column(name = "diff_image_id")
    private UUID diffImageId;

    @Column(name = "correct_verdict", length = 50)
    private String correctVerdict;

    @Column(name = "test_name", length = 255)
    private String testName;

    @Column(name = "component_name", length = 255)
    private String componentName;

    @Type(JsonType.class)
    @Column(name = "additional_data", columnDefinition = "jsonb")
    private JsonNode additionalData;
}
