package com.artifactcomparator.controller.evaluation;

import com.artifactcomparator.dto.evaluation.*;
import com.artifactcomparator.service.evaluation.AnnotationService;
import com.artifactcomparator.service.evaluation.DraftService;
import com.artifactcomparator.service.evaluation.ImageStorageService;
import com.artifactcomparator.service.evaluation.ScoringService;
import com.artifactcomparator.service.evaluation.SubmissionService;
import com.artifactcomparator.service.evaluation.TaskAssignmentService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/participant/evaluations")
@RequiredArgsConstructor
public class ParticipantEvaluationController {

    private final TaskAssignmentService assignmentService;
    private final AnnotationService annotationService;
    private final ScoringService scoringService;
    private final DraftService draftService;
    private final SubmissionService submissionService;
    private final ImageStorageService imageStorageService;

    // UC5-1: Get assigned tasks
    @GetMapping("/tasks")
    public ResponseEntity<Page<AssignmentDTO>> getMyTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "ALL") String status,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());

        Page<AssignmentDTO> tasks = assignmentService.getMyAssignedTasks(participantId, status, pageable);
        return ResponseEntity.ok(tasks);
    }

    // Get task details with artifacts
    @GetMapping("/tasks/{assignmentId}")
    public ResponseEntity<EvaluationTaskDetailDTO> getTaskDetails(
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        EvaluationTaskDetailDTO details = assignmentService.getTaskDetails(assignmentId, participantId);
        return ResponseEntity.ok(details);
    }

    // Start task
    @PostMapping("/tasks/{assignmentId}/start")
    public ResponseEntity<Void> startTask(
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        assignmentService.startTask(assignmentId, participantId);
        return ResponseEntity.ok().build();
    }

    // UC5-3: Annotations
    @PostMapping("/tasks/{assignmentId}/annotations")
    public ResponseEntity<AnnotationDTO> createAnnotation(
            @PathVariable Long assignmentId,
            @RequestBody AnnotationCreateDTO dto,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        AnnotationDTO annotation = annotationService.saveAnnotation(assignmentId, dto, participantId);
        return ResponseEntity.ok(annotation);
    }

    @GetMapping("/tasks/{assignmentId}/annotations")
    public ResponseEntity<List<AnnotationDTO>> getAnnotations(
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        List<AnnotationDTO> annotations = annotationService.getAnnotations(assignmentId, participantId);
        return ResponseEntity.ok(annotations);
    }



    @DeleteMapping("/annotations/{annotationId}")
    public ResponseEntity<Void> deleteAnnotation(
            @PathVariable Long annotationId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        annotationService.deleteAnnotation(annotationId, participantId);
        return ResponseEntity.noContent().build();
    }

    // UC5-4: Scoring
    @PostMapping("/tasks/{assignmentId}/scores")
    public ResponseEntity<ScoreEntryDTO> saveScore(
            @PathVariable Long assignmentId,
            @RequestBody ScoreRequestDTO dto,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        ScoreEntryDTO score = scoringService.saveScore(assignmentId, dto, participantId);
        return ResponseEntity.ok(score);
    }

    @GetMapping("/tasks/{assignmentId}/scores")
    public ResponseEntity<List<ScoreEntryDTO>> getScores(
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        List<ScoreEntryDTO> scores = scoringService.getScores(assignmentId, participantId);
        return ResponseEntity.ok(scores);
    }

    // UC5-3: Autosave draft
    @PostMapping("/tasks/{assignmentId}/draft")
    public ResponseEntity<Void> saveDraft(
            @PathVariable Long assignmentId,
            @RequestBody JsonNode draftData,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        draftService.saveDraft(assignmentId, draftData, participantId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tasks/{assignmentId}/draft")
    public ResponseEntity<DraftDataDTO> getDraft(
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        DraftDataDTO draft = draftService.getDraft(assignmentId, participantId);
        return ResponseEntity.ok(draft);
    }

    // UC5-5: Submit evaluation
    @PostMapping("/tasks/{assignmentId}/submit")
    public ResponseEntity<SubmissionDTO> submitEvaluation(
            @PathVariable Long assignmentId,
            @RequestBody SubmissionRequestDTO request,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        SubmissionDTO submission = submissionService.submitEvaluation(assignmentId, request, participantId);
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/tasks/{assignmentId}/submission")
    public ResponseEntity<SubmissionDTO> getSubmission(
            @PathVariable Long assignmentId,
            Authentication authentication) {

        Long participantId = getCurrentUserId(authentication);
        SubmissionDTO submission = submissionService.getSubmission(assignmentId, participantId);
        return ResponseEntity.ok(submission);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<Resource> getEvaluationImage(@PathVariable String imageId) {
        try {
            UUID uuid = UUID.fromString(imageId);
            Resource resource = imageStorageService.loadImage(uuid);
            MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Helper method to get current user ID from authentication
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
