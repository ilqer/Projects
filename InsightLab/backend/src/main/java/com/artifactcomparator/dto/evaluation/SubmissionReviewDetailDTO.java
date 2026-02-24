package com.artifactcomparator.dto.evaluation;

import com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO;
import com.artifactcomparator.model.evaluation.ArtifactReference;
import com.artifactcomparator.model.evaluation.EvaluationCriterionDefinition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionReviewDetailDTO {

    private AssignmentDTO assignment;
    private EvaluationTaskDTO task;
    private TaskTypeDTO taskType;
    private List<ArtifactDTO> artifacts;
    private List<CriteriaItemDTO> criteria;
    private List<ArtifactReference> artifactReferences;
    private List<EvaluationCriterionDefinition> dynamicCriteria;
    private List<ViewerArtifactDTO> viewerArtifacts;
    private List<ScoreEntryDTO> scores;
    private List<AnnotationDTO> annotations;
    private SubmissionDTO submission;
    private Long studyId;
    private String studyTitle;
    private String participantEmail;
    private String participantUsername;
    private String snapshotDecision;
    private String snapshotExplanation;
    private String snapshotConfidence;
    private String cloneRelationship;
    private Double cloneSimilarity;
    private String cloneNotes;
    private String bugSeverity;
    private String bugReproducible;
    private String bugCategory;
    private String bugNotes;
    private String solidViolatedPrinciple;
    private String solidViolationSeverity;
    private String solidExplanation;
    private String solidSuggestedFix;
    private String reviewerStatus;
    private String reviewerNotes;
    private Integer reviewerQualityScore;
    private Long reviewedById;
    private String reviewedByName;
    private java.time.LocalDateTime reviewedAt;
}
