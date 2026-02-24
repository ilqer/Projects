package com.artifactcomparator.model.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

@Entity
@Table(name = "criteria_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriteriaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criteria_set_id")
    private CriteriaSet criteriaSet;

    @Column(nullable = false)
    private String name;

    @Column(name = "criterion_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private CriterionType criterionType;

    @Column(name = "scale_type")
    @Enumerated(EnumType.STRING)
    private ScaleType scaleType;

    @Column(name = "is_required")
    private Boolean isRequired = true;

    @Column(name = "weight")
    private Double weight = 1.0;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode options;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public enum CriterionType {
        SELECTION,
        RATING,
        TEXT_INPUT,
        MULTIPLE_CHOICE,
        BOOLEAN
    }

    public enum ScaleType {
        LIKERT_5,
        NUMERIC_10,
        CATEGORICAL,
        BOOLEAN
    }
}
