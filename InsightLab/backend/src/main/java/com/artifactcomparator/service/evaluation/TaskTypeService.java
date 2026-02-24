package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.TaskTypeDTO;
import com.artifactcomparator.dto.evaluation.TaskTypeCreateDTO;
import com.artifactcomparator.model.User;
import com.artifactcomparator.model.evaluation.*;
import com.artifactcomparator.repository.UserRepository;
import com.artifactcomparator.repository.evaluation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskTypeService {

    private final TaskTypeRepository taskTypeRepository;
    private final CriteriaSetRepository criteriaSetRepository;
    private final CriteriaItemRepository criteriaItemRepository;
    private final UserRepository userRepository;

    @Transactional
    public TaskTypeDTO createTaskType(TaskTypeCreateDTO dto, Long createdById) {
        // Get creator user
        User creator = userRepository.findById(createdById)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create task type
        TaskType taskType = new TaskType();
        taskType.setName(dto.getName());
        taskType.setDescription(dto.getDescription());
        taskType.setArtifactType(TaskType.ArtifactType.valueOf(dto.getArtifactType()));
        taskType.setLayoutMode(TaskType.LayoutMode.valueOf(dto.getLayoutMode()));
        taskType.setComparisonMode(TaskType.ComparisonMode.valueOf(dto.getComparisonMode()));
        taskType.setCreatedBy(creator);

        taskType = taskTypeRepository.save(taskType);

        // Create criteria set if criteria items are provided
        if (dto.getCriteriaItems() != null && !dto.getCriteriaItems().isEmpty()) {
            CriteriaSet criteriaSet = new CriteriaSet();
            criteriaSet.setName(dto.getName() + " Criteria");
            criteriaSet.setDescription("Evaluation criteria for " + dto.getName());
            criteriaSet = criteriaSetRepository.save(criteriaSet);

            // Create criteria items
            final CriteriaSet finalCriteriaSet = criteriaSet;

            for (var itemDto : dto.getCriteriaItems()) {
                CriteriaItem item = new CriteriaItem();
                item.setCriteriaSet(finalCriteriaSet);
                item.setName(itemDto.getName());
                item.setCriterionType(CriteriaItem.CriterionType.valueOf(itemDto.getCriterionType()));
                if (itemDto.getScaleType() != null) {
                    item.setScaleType(CriteriaItem.ScaleType.valueOf(itemDto.getScaleType()));
                }
                item.setIsRequired(itemDto.getIsRequired() != null ? itemDto.getIsRequired() : true);
                item.setDisplayOrder(itemDto.getDisplayOrder() != null ? itemDto.getDisplayOrder() : 0);
                item.setWeight(itemDto.getWeight() != null ? itemDto.getWeight() : 1.0);
                item.setOptions(itemDto.getOptions());
                criteriaItemRepository.save(item);
            }
        }

        return convertToDTO(taskType);
    }

    @Transactional(readOnly = true)
    public List<TaskTypeDTO> getAllTaskTypes() {
        return taskTypeRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskTypeDTO getTaskTypeById(Long id) {
        TaskType taskType = taskTypeRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Task type not found"));
        return convertToDTO(taskType);
    }

    @Transactional
    public void deleteTaskType(Long id) {
        taskTypeRepository.deleteById(id);
    }

    private TaskTypeDTO convertToDTO(TaskType taskType) {
        return TaskTypeDTO.builder()
            .id(taskType.getId())
            .name(taskType.getName())
            .description(taskType.getDescription())
            .artifactType(taskType.getArtifactType().name())
            .layoutMode(taskType.getLayoutMode().name())
            .comparisonMode(taskType.getComparisonMode().name())
            .createdAt(taskType.getCreatedAt())
            .build();
    }
}
