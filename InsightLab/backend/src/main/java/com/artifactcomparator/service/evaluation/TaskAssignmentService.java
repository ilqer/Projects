package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.TagDTO;
import com.artifactcomparator.dto.evaluation.*;
import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.evaluation.*;
import com.artifactcomparator.repository.ArtifactRepository;
import com.artifactcomparator.repository.evaluation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class TaskAssignmentService {

    private final ParticipantTaskAssignmentRepository assignmentRepository;
    private final EvaluationTaskRepository taskRepository;
    private final EvaluationArtifactRepository artifactRepository;
    private final CriteriaItemRepository criteriaRepository;
    private final EvaluationDraftRepository draftRepository;
    private final ArtifactMappingService artifactMappingService;
    private final ArtifactRepository storedArtifactRepository;

    @Transactional(readOnly = true)
    public Page<AssignmentDTO> getMyAssignedTasks(Long participantId, String status, Pageable pageable) {
        if ("ALL".equalsIgnoreCase(status)) {
            return assignmentRepository.findByParticipantId(participantId, pageable).map(this::convertToDTO);
        }
        try {
            ParticipantTaskAssignment.AssignmentStatus assignmentStatus = ParticipantTaskAssignment.AssignmentStatus.valueOf(status.toUpperCase());
            return assignmentRepository.findByParticipantIdAndStatus(participantId, assignmentStatus, pageable).map(this::convertToDTO);
        } catch (IllegalArgumentException e) {
            // Handle invalid status string
            return Page.empty(pageable);
        }
    }

    @Transactional(readOnly = true)
    public EvaluationTaskDetailDTO getTaskDetails(Long assignmentId, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        EvaluationTask task = assignment.getEvaluationTask();
        TaskType taskType = task.getTaskType();

        // Load artifacts
        List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> artifacts =
            artifactMappingService.getArtifactsForTask(task.getId());
        if (Boolean.TRUE.equals(task.getBlindedMode())) {
            artifacts = applyBlindedPresentation(task, artifacts);
        }

        // Load criteria
        List<CriteriaItemDTO> criteria = taskType != null
            ? getCriteriaForTaskType(taskType.getId())
            : java.util.Collections.emptyList();

        // Load existing draft if any
        DraftDataDTO draft = draftRepository.findByAssignmentId(assignmentId)
            .map(this::convertDraftToDTO)
            .orElse(null);

        return EvaluationTaskDetailDTO.builder()
            .assignment(convertToDTO(assignment))
            .task(convertTaskToDTO(task))
            .taskType(taskType != null ? convertTaskTypeToDTO(taskType) : null)
            .artifacts(artifacts)
            .criteria(criteria)
            .artifactReferences(task.getArtifacts())
            .dynamicCriteria(task.getCriteria())
            .viewerArtifacts(buildViewerArtifacts(task, artifacts))
            .draft(draft)
            .build();
    }

    @Transactional
    public void startTask(Long assignmentId, Long participantId) {
        ParticipantTaskAssignment assignment = assignmentRepository
            .findByIdAndParticipantId(assignmentId, participantId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (assignment.getStatus() == ParticipantTaskAssignment.AssignmentStatus.PENDING) {
            assignment.setStatus(ParticipantTaskAssignment.AssignmentStatus.IN_PROGRESS);
            assignment.setStartedAt(LocalDateTime.now());
            assignmentRepository.save(assignment);
        }
    }

    private List<CriteriaItemDTO> getCriteriaForTaskType(Long taskTypeId) {
        return criteriaRepository.findByTaskTypeId(taskTypeId).stream()
            .map(this::convertCriteriaToDTO)
            .toList();
    }

    private AssignmentDTO convertToDTO(ParticipantTaskAssignment assignment) {
        EvaluationTask task = assignment.getEvaluationTask();
        return AssignmentDTO.builder()
            .id(assignment.getId())
            .evaluationTaskId(task.getId())
            .taskTitle(task.getTitle())
            .taskDescription(task.getDescription())
            .participantId(assignment.getParticipant().getId())
            .participantName(assignment.getParticipant().getFullName())
            .participantEmail(assignment.getParticipant().getEmail())
            .participantUsername(assignment.getParticipant().getUsername())
            .status(assignment.getStatus().name())
            .assignedAt(assignment.getAssignedAt())
            .dueDate(assignment.getDueDate())
            .startedAt(assignment.getStartedAt())
            .submittedAt(assignment.getSubmittedAt())
            .taskTypeName(task.getTaskType() != null ? task.getTaskType().getName() : null)
            .layoutMode(task.getTaskType() != null ? task.getTaskType().getLayoutMode().name() : null)
            .comparisonMode(task.getTaskType() != null ? task.getTaskType().getComparisonMode().name() : null)
            .build();
    }

    private EvaluationTaskDTO convertTaskToDTO(EvaluationTask task) {
        return EvaluationTaskDTO.builder()
            .id(task.getId())
            .taskTypeId(task.getTaskType() != null ? task.getTaskType().getId() : null)
            .studyId(task.getStudy() != null ? task.getStudy().getId() : null)
            .title(task.getTitle())
            .description(task.getDescription())
            .instructions(task.getInstructions())
            .status(task.getStatus().name())
            .dueDate(task.getDueDate())
            .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
            .createdByName(task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : null)
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .allowHighlight(task.getAllowHighlight())
            .allowAnnotation(task.getAllowAnnotation())
            .allowTagging(task.getAllowTagging())
            .layoutMode(task.getLayoutMode() != null ? task.getLayoutMode().name() : null)
            .cloneOriginalCodeContent(task.getCloneOriginalCodeContent())
            .cloneCloneCodeContent(task.getCloneCloneCodeContent())
            .bugReportJson(task.getBugReportJson())
            .solidJson(task.getSolidJson())
            .blindedMode(task.getBlindedMode())
            .blindedOrder(task.getBlindedOrder())
            .artifacts(task.getArtifacts())
            .criteria(task.getCriteria())
            .build();
    }

    private TaskTypeDTO convertTaskTypeToDTO(TaskType taskType) {
        if (taskType == null) {
            return null;
        }
        return TaskTypeDTO.builder()
            .id(taskType.getId())
            .name(taskType.getName())
            .artifactType(taskType.getArtifactType().name())
            .layoutMode(taskType.getLayoutMode().name())
            .comparisonMode(taskType.getComparisonMode().name())
            .description(taskType.getDescription())
            .createdById(taskType.getCreatedBy() != null ? taskType.getCreatedBy().getId() : null)
            .createdByName(taskType.getCreatedBy() != null ? taskType.getCreatedBy().getFullName() : null)
            .createdAt(taskType.getCreatedAt())
            .build();
    }

    private CriteriaItemDTO convertCriteriaToDTO(CriteriaItem item) {
        return CriteriaItemDTO.builder()
            .id(item.getId())
            .criteriaSetId(item.getCriteriaSet().getId())
            .name(item.getName())
            .criterionType(item.getCriterionType().name())
            .scaleType(item.getScaleType() != null ? item.getScaleType().name() : null)
            .isRequired(item.getIsRequired())
            .weight(item.getWeight())
            .options(item.getOptions())
            .displayOrder(item.getDisplayOrder())
            .build();
    }

    private DraftDataDTO convertDraftToDTO(EvaluationDraft draft) {
        return DraftDataDTO.builder()
            .id(draft.getId())
            .assignmentId(draft.getAssignment().getId())
            .draftData(draft.getDraftData())
            .lastSavedAt(draft.getLastSavedAt())
            .build();
    }

    private List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> applyBlindedPresentation(
        EvaluationTask task,
        List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> artifacts
    ) {
        List<Integer> order = ensureBlindedOrder(task, artifacts.size());
        if (order.isEmpty()) {
            return artifacts;
        }

        Map<Integer, com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> byOrder = artifacts.stream()
            .collect(Collectors.toMap(
                dto -> dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0,
                Function.identity(),
                (left, right) -> left
            ));

        List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> reordered = new ArrayList<>();
        for (int i = 0; i < order.size(); i++) {
            com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO dto = byOrder.get(order.get(i));
            if (dto == null) {
                continue;
            }
            dto.setDisplayOrder(i + 1);
            dto.setDisplayLabel(buildDocumentLabel(i));
            dto.setBlinded(Boolean.TRUE);
            dto.setMetadata(null);
            dto.setTags(null); // Strip tags in blinded mode
            reordered.add(dto);
        }
        return reordered;
    }

    private List<ViewerArtifactDTO> buildViewerArtifacts(
        EvaluationTask task,
        List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> legacyArtifacts
    ) {
        if (task.getArtifacts() != null && !task.getArtifacts().isEmpty()) {
            List<ArtifactReference> references = new ArrayList<>(task.getArtifacts());
            references.sort(Comparator.comparing(ref -> ref.getDisplayOrder() != null ? ref.getDisplayOrder() : 0));

            if (Boolean.TRUE.equals(task.getBlindedMode()) && task.getBlindedOrder() != null && !task.getBlindedOrder().isEmpty()) {
                List<ArtifactReference> reordered = new ArrayList<>();
                for (Integer displayOrder : task.getBlindedOrder()) {
                    references.stream()
                        .filter(ref -> Objects.equals(ref.getDisplayOrder(), displayOrder))
                        .findFirst()
                        .ifPresent(reordered::add);
                }
                if (!reordered.isEmpty()) {
                    references = reordered;
                }
            }

            List<ArtifactReference> finalReferences = references;
            return IntStream.range(0, finalReferences.size())
                .mapToObj(index -> buildReferenceViewerArtifact(task, finalReferences.get(index), index))
                .filter(Objects::nonNull)
                .toList();
        }

        if (legacyArtifacts == null || legacyArtifacts.isEmpty()) {
            return List.of();
        }

        List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> orderedLegacy = new ArrayList<>(legacyArtifacts);
        orderedLegacy.sort(Comparator.comparing(dto -> dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0));

        List<com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO> finalOrderedLegacy = orderedLegacy;
        return IntStream.range(0, finalOrderedLegacy.size())
            .mapToObj(index -> {
                com.artifactcomparator.dto.evaluation.artifact.ArtifactDTO artifact = finalOrderedLegacy.get(index);
                String displayName = artifact.getDisplayLabel();
                if (displayName == null || displayName.isBlank()) {
                    displayName = "Artifact " + (char) ('A' + index);
                }
                return ViewerArtifactDTO.builder()
                    .artifactId(artifact.getId())
                    .displayName(displayName)
                    .displayOrder(index + 1)
                    .mimeType("application/octet-stream")
                    .url(artifact.getId() != null ? "/api/artifacts/" + artifact.getId() + "/download" : null)
                    .tags(artifact.getTags())
                    .build();
            })
            .toList();
    }

    private ViewerArtifactDTO buildReferenceViewerArtifact(EvaluationTask task, ArtifactReference reference, int index) {
        String label = reference.getDisplayLabel();
        if (Boolean.TRUE.equals(task.getBlindedMode())) {
            label = "Artifact " + (char) ('A' + index);
        } else if (label == null || label.isBlank()) {
            label = "Artifact " + (index + 1);
        }

        Artifact artifact = null;
        if (reference.getArtifactId() != null) {
            artifact = storedArtifactRepository.findById(reference.getArtifactId())
                .orElse(null);
        }

        List<TagDTO> tags = null;
        if (artifact != null && !Boolean.TRUE.equals(task.getBlindedMode())) {
            tags = artifact.getTags().stream()
                .map(tag -> new TagDTO(tag.getId(), tag.getName(), tag.getColor(), tag.getDescription(), null, null, null, null, 0))
                .collect(Collectors.toList());
        }

        return ViewerArtifactDTO.builder()
            .artifactId(reference.getArtifactId())
            .displayName(label)
            .displayOrder(reference.getDisplayOrder())
            .mimeType(artifact != null ? artifact.getContentType() : "application/octet-stream")
            .url(reference.getArtifactId() != null ? "/api/artifacts/" + reference.getArtifactId() + "/download" : null)
            .tags(tags)
            .build();
    }

    private List<Integer> ensureBlindedOrder(EvaluationTask task, int artifactCount) {
        List<Integer> order = task.getBlindedOrder();
        if (artifactCount <= 0) {
            return List.of();
        }
        if (order == null || order.size() != artifactCount) {
            order = new ArrayList<>();
            for (int i = 1; i <= artifactCount; i++) {
                order.add(i);
            }
            java.util.Collections.shuffle(order);
            task.setBlindedOrder(order);
            taskRepository.save(task);
        }
        return order;
    }

    private String buildDocumentLabel(int index) {
        int value = index;
        StringBuilder sb = new StringBuilder();
        do {
            int remainder = value % 26;
            sb.insert(0, (char) ('A' + remainder));
            value = value / 26 - 1;
        } while (value >= 0);
        return "Document " + sb;
    }
}
