package com.artifactcomparator.controller.evaluation;

import com.artifactcomparator.dto.evaluation.*;
import com.artifactcomparator.dto.evaluation.SubmissionExportResult;
import com.artifactcomparator.dto.evaluation.SubmissionReviewDetailDTO;
import com.artifactcomparator.dto.evaluation.SubmissionReviewSummaryDTO;
import com.artifactcomparator.service.evaluation.EvaluationTaskService;
import com.artifactcomparator.service.evaluation.ImageStorageService;
import com.artifactcomparator.service.evaluation.SubmissionService;
import com.artifactcomparator.service.evaluation.TaskTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/researcher/evaluations")
@RequiredArgsConstructor
public class ResearcherEvaluationController {

    private final TaskTypeService taskTypeService;
    private final EvaluationTaskService evaluationTaskService;
    private final ImageStorageService imageStorageService;
    private final SubmissionService submissionService;

    // Task Type Management
    @PostMapping("/task-types")
    public ResponseEntity<TaskTypeDTO> createTaskType(
            @RequestBody TaskTypeCreateDTO dto,
            Authentication authentication) {

        Long researcherId = getCurrentUserId(authentication);
        TaskTypeDTO taskType = taskTypeService.createTaskType(dto, researcherId);
        return ResponseEntity.ok(taskType);
    }

    @GetMapping("/task-types")
    public ResponseEntity<List<TaskTypeDTO>> getAllTaskTypes() {
        List<TaskTypeDTO> taskTypes = taskTypeService.getAllTaskTypes();
        return ResponseEntity.ok(taskTypes);
    }

    @GetMapping("/task-types/{id}")
    public ResponseEntity<TaskTypeDTO> getTaskType(@PathVariable Long id) {
        TaskTypeDTO taskType = taskTypeService.getTaskTypeById(id);
        return ResponseEntity.ok(taskType);
    }

    @DeleteMapping("/task-types/{id}")
    public ResponseEntity<Void> deleteTaskType(@PathVariable Long id) {
        taskTypeService.deleteTaskType(id);
        return ResponseEntity.noContent().build();
    }

    // Evaluation Task Management
    @PostMapping("/tasks")
    public ResponseEntity<EvaluationTaskDTO> createTask(
            @RequestBody EvaluationTaskCreateDTO dto,
            Authentication authentication) {

        Long researcherId = getCurrentUserId(authentication);
        EvaluationTaskDTO task = evaluationTaskService.createTask(dto, researcherId);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<EvaluationTaskDTO>> getMyTasks(Authentication authentication) {
        Long researcherId = getCurrentUserId(authentication);
        List<EvaluationTaskDTO> tasks = evaluationTaskService.getAllTasks(researcherId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<EvaluationTaskDTO> getTask(@PathVariable Long id) {
        EvaluationTaskDTO task = evaluationTaskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        evaluationTaskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{id}/participants")
    public ResponseEntity<List<ParticipantAssignmentDTO>> getTaskParticipants(@PathVariable Long id) {
        List<ParticipantAssignmentDTO> participants = evaluationTaskService.getTaskAssignments(id);
        return ResponseEntity.ok(participants);
    }

    @DeleteMapping("/tasks/{taskId}/participants/{assignmentId}")
    public ResponseEntity<Void> removeTaskParticipant(
            @PathVariable Long taskId,
            @PathVariable Long assignmentId,
            Authentication authentication) {
        Long researcherId = getCurrentUserId(authentication);
        evaluationTaskService.removeTaskParticipant(taskId, assignmentId, researcherId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{id}/participants/export/pdf")
    public ResponseEntity<byte[]> exportTaskParticipantsAsPDF(@PathVariable Long id) {
        try {
            byte[] pdfBytes = evaluationTaskService.exportTaskParticipantsAsPDF(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String filename = "task_participants_" + id + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/tasks/{id}/participants/export/excel")
    public ResponseEntity<byte[]> exportTaskParticipantsAsExcel(@PathVariable Long id) {
        try {
            byte[] excelBytes = evaluationTaskService.exportTaskParticipantsAsExcel(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            String filename = "task_participants_" + id + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
        } catch (IOException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/tasks/{taskId}/submissions")
    public ResponseEntity<List<SubmissionReviewSummaryDTO>> getTaskSubmissions(
            @PathVariable Long taskId,
            Authentication authentication) {

        Long researcherId = getCurrentUserId(authentication);
        List<SubmissionReviewSummaryDTO> summaries = submissionService.getTaskSubmissionSummaries(taskId, researcherId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/tasks/{taskId}/submissions/{assignmentId}")
    public ResponseEntity<SubmissionReviewDetailDTO> getSubmissionDetail(
            @PathVariable Long taskId,
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long researcherId = getCurrentUserId(authentication);
        SubmissionReviewDetailDTO detail = submissionService.getSubmissionDetail(taskId, assignmentId, researcherId);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/tasks/{taskId}/submissions/export")
    public ResponseEntity<byte[]> exportSubmissions(
            @PathVariable Long taskId,
            @RequestParam(defaultValue = "csv") String format,
            Authentication authentication) {

        Long researcherId = getCurrentUserId(authentication);
        SubmissionExportResult exportResult = submissionService.exportTaskSubmissions(taskId, researcherId, format);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + exportResult.getFileName())
            .contentType(MediaType.parseMediaType(exportResult.getContentType()))
            .body(exportResult.getData());
    }

    // Image Upload for Snapshot Artifacts
    @PostMapping("/images/upload")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        // Ensure authenticated
        getCurrentUserId(authentication);

        UUID imageId = imageStorageService.storeImage(file);

        Map<String, String> response = new HashMap<>();
        response.put("imageId", imageId.toString());
        response.put("message", "Image uploaded successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<Resource> getImage(@PathVariable String imageId) {
        try {
            UUID uuid = UUID.fromString(imageId);
            Resource resource = imageStorageService.loadImage(uuid);

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Helper method
    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.artifactcomparator.security.CustomUserDetailsService.CustomUserPrincipal) {
            return ((com.artifactcomparator.security.CustomUserDetailsService.CustomUserPrincipal) principal).getUser().getId();
        }
        throw new IllegalStateException("Invalid principal type");
    }
}
