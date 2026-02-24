package com.artifactcomparator.controller.evaluation;

import com.artifactcomparator.dto.evaluation.CustomEvaluationTaskRequest;
import com.artifactcomparator.dto.evaluation.EvaluationTaskCreateDTO;
import com.artifactcomparator.dto.evaluation.EvaluationTaskDTO;
import com.artifactcomparator.dto.evaluation.EvaluationTaskDetailResponseDTO;
import com.artifactcomparator.dto.evaluation.TaskParticipantUpdateRequest;
import com.artifactcomparator.dto.evaluation.template.EvaluationTaskTemplateDTO;
import com.artifactcomparator.dto.evaluation.template.TemplateApplyRequest;
import com.artifactcomparator.service.evaluation.EvaluationTaskService;
import com.artifactcomparator.service.evaluation.EvaluationTaskTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EvaluationTaskController {

    private final EvaluationTaskService evaluationTaskService;
    private final EvaluationTaskTemplateService templateService;

    @PostMapping("/studies/{studyId}/evaluation-tasks/custom")
    public ResponseEntity<EvaluationTaskDTO> createCustomTask(
        @PathVariable Long studyId,
        @Valid @RequestBody CustomEvaluationTaskRequest request,
        Authentication authentication
    ) {
        Long researcherId = getCurrentUserId(authentication);
        EvaluationTaskCreateDTO dto = EvaluationTaskCreateDTO.builder()
            .studyId(studyId)
            .title(request.getTitle())
            .description(request.getDescription())
            .instructions(request.getInstructions())
            .artifactReferences(request.getArtifactReferences())
            .criteria(request.getCriteria())
            .allowHighlight(request.getAllowHighlight())
            .allowAnnotation(request.getAllowAnnotation())
            .allowTagging(request.getAllowTagging())
            .layoutMode(request.getLayoutMode())
            .blindedMode(request.getBlindedMode())
            .participantIds(request.getParticipantIds())
            .dueDate(request.getDueDate())
            .build();
        EvaluationTaskDTO created = evaluationTaskService.createTask(dto, researcherId);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/evaluation-tasks/{taskId}/participants")
    public ResponseEntity<Void> addParticipants(
        @PathVariable Long taskId,
        @RequestBody TaskParticipantUpdateRequest request,
        Authentication authentication
    ) {
        Long researcherId = getCurrentUserId(authentication);
        evaluationTaskService.addParticipants(taskId, request.getParticipantIds(), request.getDueDate(), researcherId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/evaluation-tasks/{taskId}")
    public ResponseEntity<EvaluationTaskDetailResponseDTO> getTaskDetail(
        @PathVariable Long taskId,
        Authentication authentication
    ) {
        Long requesterId = getCurrentUserId(authentication);
        EvaluationTaskDetailResponseDTO detail = evaluationTaskService.getTaskDetail(taskId, requesterId);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/evaluation-task-templates")
    public ResponseEntity<List<EvaluationTaskTemplateDTO>> listTemplates() {
        return ResponseEntity.ok(templateService.listTemplates());
    }

    @PostMapping("/evaluation-task-templates/apply")
    public ResponseEntity<EvaluationTaskTemplateDTO> applyTemplate(
        @Valid @RequestBody TemplateApplyRequest request
    ) {
        return ResponseEntity.ok(templateService.getTemplate(request.getTemplateId()));
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.artifactcomparator.security.CustomUserDetailsService.CustomUserPrincipal customUserPrincipal) {
            return customUserPrincipal.getUser().getId();
        }
        throw new IllegalStateException("Invalid principal type");
    }
}
