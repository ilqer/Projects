package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantEvaluationDetailDTO {

    private Long id;
    private Long reviewerAssignmentId;
    private Long studyId;
    private String studyTitle;
    private Long participantId;
    private String participantCode; // Anonim kod
    private String participantEmail; // Optional, anonim olabilir
    
    // Evaluation info
    private Integer artifactsEvaluated;
    private Integer evaluationTimeMinutes;
    private Integer completenessPercentage;
    private LocalDateTime evaluatedAt;
    
    // Artifacts değerlendirme detayları
    private List<ArtifactEvaluationInfo> artifacts;
    
    // Participant'ın verdiği rating'ler ve yorumlar
    private Map<String, ParticipantRatings> participantRatings; // artifactId -> ratings
    private Map<String, String> participantComments; // artifactId -> comment
    private Map<String, String> participantAnnotations; // artifactId -> annotation
    
    // Participant'ın tercihi (eğer comparison study ise)
    private String preferredArtifactId;
    private String preferenceJustification;
    
    // Reviewer'ın kararı (eğer daha önce review edildiyse)
    private String reviewDecision; // PENDING, ACCEPTED, REJECTED, FLAGGED
    private Integer qualityRating;
    private Integer consistencyRating;
    private Integer completenessRating;
    private List<String> issuesFound;
    private String reviewerComments;
    private String flagReason;
    private LocalDateTime reviewedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArtifactEvaluationInfo {
        private Long artifactId;
        private String artifactName;
        private String artifactType;
        private String artifactContent; // Optional, büyükse gösterme
        private Integer contentSize;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantRatings {
        private Integer readability;
        private Integer correctness;
        private Integer maintainability;
        private Integer overallRating;
    }
}