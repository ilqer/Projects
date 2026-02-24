package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.artifact.*;
import com.artifactcomparator.model.evaluation.TaskType;
import com.artifactcomparator.model.evaluation.artifact.*;
import com.artifactcomparator.repository.evaluation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtifactMappingService {

    private final EvaluationArtifactRepository artifactRepository;
    private final BugReportArtifactRepository bugReportRepository;
    private final CodeCloneArtifactRepository codeCloneRepository;
    private final SolidViolationArtifactRepository solidViolationRepository;
    private final SnapshotArtifactRepository snapshotRepository;

    @Transactional(readOnly = true)
    public List<ArtifactDTO> getArtifactsForTask(Long taskId) {
        List<EvaluationArtifact> artifacts = artifactRepository.findByEvaluationTaskIdOrderByDisplayOrder(taskId);

        return artifacts.stream()
            .map(this::convertToSpecificDTO)
            .toList();
    }

    private ArtifactDTO convertToSpecificDTO(EvaluationArtifact artifact) {
        return switch (artifact.getArtifactType()) {
            case BUG_REPORT -> convertBugReportDTO(
                bugReportRepository.findById(artifact.getId()).orElseThrow()
            );
            case CODE_CLONE -> convertCodeCloneDTO(
                codeCloneRepository.findById(artifact.getId()).orElseThrow()
            );
            case SOLID_VIOLATION -> convertSolidViolationDTO(
                solidViolationRepository.findById(artifact.getId()).orElseThrow()
            );
            case SNAPSHOT -> convertSnapshotDTO(
                snapshotRepository.findById(artifact.getId()).orElseThrow()
            );
        };
    }

    private BugReportDTO convertBugReportDTO(BugReportArtifact artifact) {
        BugReportDTO dto = BugReportDTO.builder()
            .title(artifact.getTitle())
            .description(artifact.getDescription())
            .severity(artifact.getSeverity())
            .priority(artifact.getPriority())
            .reporter(artifact.getReporter())
            .dateReported(artifact.getDateReported())
            .llmSuggestedCategory(artifact.getLlmSuggestedCategory())
            .additionalData(artifact.getAdditionalData())
            .build();

        // Set base properties
        setBaseProperties(dto, artifact);
        return dto;
    }

    private CodeCloneDTO convertCodeCloneDTO(CodeCloneArtifact artifact) {
        CodeCloneDTO dto = CodeCloneDTO.builder()
            .codeSnippet1(artifact.getCodeSnippet1())
            .codeSnippet2(artifact.getCodeSnippet2())
            .language(artifact.getLanguage())
            .similarityScore(artifact.getSimilarityScore())
            .additionalData(artifact.getAdditionalData())
            .build();

        setBaseProperties(dto, artifact);
        return dto;
    }

    private SolidViolationDTO convertSolidViolationDTO(SolidViolationArtifact artifact) {
        SolidViolationDTO dto = SolidViolationDTO.builder()
            .codeSnippet(artifact.getCodeSnippet())
            .language(artifact.getLanguage())
            .llmAnalysis(artifact.getLlmAnalysis())
            .llmSuggestedFix(artifact.getLlmSuggestedFix())
            .difficultyLevel(artifact.getDifficultyLevel())
            .additionalData(artifact.getAdditionalData())
            .build();

        setBaseProperties(dto, artifact);
        return dto;
    }

    private SnapshotDTO convertSnapshotDTO(SnapshotArtifact artifact) {
        SnapshotDTO dto = SnapshotDTO.builder()
            .referenceImageId(artifact.getReferenceImageId())
            .failureImageId(artifact.getFailureImageId())
            .diffImageId(artifact.getDiffImageId())
            .testName(artifact.getTestName())
            .componentName(artifact.getComponentName())
            .additionalData(artifact.getAdditionalData())
            .build();

        setBaseProperties(dto, artifact);
        return dto;
    }

    private void setBaseProperties(ArtifactDTO dto, EvaluationArtifact artifact) {
        dto.setId(artifact.getId());
        dto.setArtifactType(artifact.getArtifactType().name());
        dto.setEvaluationTaskId(artifact.getEvaluationTask() != null ? artifact.getEvaluationTask().getId() : null);
        dto.setPanelNumber(artifact.getPanelNumber());
        dto.setDisplayOrder(artifact.getDisplayOrder());
        dto.setMetadata(artifact.getMetadata());
        dto.setDisplayLabel(null);
        dto.setBlinded(Boolean.FALSE);
    }
}
