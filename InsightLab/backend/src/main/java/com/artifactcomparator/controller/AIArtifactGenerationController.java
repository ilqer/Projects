package com.artifactcomparator.controller;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.model.*;
import com.artifactcomparator.service.AIArtifactGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai-artifacts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESEARCHER')")
public class AIArtifactGenerationController {
    
    private static final Logger logger = LoggerFactory.getLogger(AIArtifactGenerationController.class);
    
    private final AIArtifactGenerationService aiArtifactGenerationService;
    
    @PostMapping("/generate")
    public ResponseEntity<?> generateArtifact(@Valid @RequestBody GenerateArtifactRequestDTO request) {
        logger.info("Received artifact generation request: {}", request.getDescription());
        try {
            AIArtifactGenerationJob job = aiArtifactGenerationService.createGenerationJob(
                    request.getDescription(),
                    request.getProgrammingLanguage(),
                    request.getComplexity(),
                    request.getIncludeComments(),
                    request.getFollowBestPractices(),
                    request.getAddErrorHandling()
            );
            return ResponseEntity.ok(convertJobToDTO(job));
        } catch (Exception e) {
            logger.error("Error creating artifact generation job: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/jobs")
    public ResponseEntity<?> getMyJobs() {
        try {
            List<AIArtifactGenerationJob> jobs = aiArtifactGenerationService.getMyJobs();
            return ResponseEntity.ok(jobs.stream()
                    .map(this::convertJobToDTO)
                    .collect(Collectors.toList()));
        } catch (Exception e) {
            logger.error("Error getting jobs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJobById(@PathVariable Long jobId) {
        try {
            AIArtifactGenerationJob job = aiArtifactGenerationService.getJobById(jobId);
            return ResponseEntity.ok(convertJobToDTO(job));
        } catch (Exception e) {
            logger.error("Error getting job {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/drafts/pending")
    public ResponseEntity<?> getPendingDrafts() {
        try {
            List<AIArtifactDraft> drafts = aiArtifactGenerationService.getPendingDrafts();
            return ResponseEntity.ok(drafts.stream()
                    .map(this::convertDraftToDTO)
                    .collect(Collectors.toList()));
        } catch (Exception e) {
            logger.error("Error getting pending drafts: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/drafts/{draftId}")
    public ResponseEntity<?> updateDraft(
            @PathVariable Long draftId,
            @RequestBody AIArtifactGenerationService.DraftUpdate update
    ) {
        logger.info("Updating draft {}", draftId);
        try {
            AIArtifactDraft draft = aiArtifactGenerationService.updateDraft(
                    draftId,
                    update.getName(),
                    update.getContent(),
                    update.getDescription()
            );
            return ResponseEntity.ok(convertDraftToDTO(draft));
        } catch (Exception e) {
            logger.error("Error updating draft {}: {}", draftId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/drafts/{draftId}/approve")
    public ResponseEntity<?> approveDraft(@PathVariable Long draftId) {
        logger.info("Approving draft {}", draftId);
        try {
            Artifact artifact = aiArtifactGenerationService.approveDraft(draftId);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Draft approved and artifact created");
            response.put("artifactId", artifact.getId());
            response.put("artifactName", artifact.getOriginalFilename());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error approving draft {}: {}", draftId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/drafts/{draftId}/discard")
    public ResponseEntity<?> discardDraft(@PathVariable Long draftId) {
        logger.info("Discarding draft {}", draftId);
        try {
            AIArtifactDraft draft = aiArtifactGenerationService.discardDraft(draftId);
            return ResponseEntity.ok(convertDraftToDTO(draft));
        } catch (Exception e) {
            logger.error("Error discarding draft {}: {}", draftId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    private AIArtifactJobDTO convertJobToDTO(AIArtifactGenerationJob job) {
        AIArtifactJobDTO dto = new AIArtifactJobDTO();
        dto.setId(job.getId());
        dto.setResearcherId(job.getResearcher().getId());
        dto.setDescription(job.getDescription());
        dto.setProgrammingLanguage(job.getProgrammingLanguage());
        dto.setComplexity(job.getComplexity());
        dto.setIncludeComments(job.getIncludeComments());
        dto.setFollowBestPractices(job.getFollowBestPractices());
        dto.setAddErrorHandling(job.getAddErrorHandling());
        dto.setStatus(job.getStatus().name());
        dto.setErrorMessage(job.getErrorMessage());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setUpdatedAt(job.getUpdatedAt());
        return dto;
    }
    
    private AIArtifactDraftDTO convertDraftToDTO(AIArtifactDraft draft) {
        AIArtifactDraftDTO dto = new AIArtifactDraftDTO();
        dto.setId(draft.getId());
        dto.setJobId(draft.getJob().getId());
        dto.setResearcherId(draft.getResearcher().getId());
        dto.setName(draft.getName());
        dto.setContent(draft.getContent());
        dto.setProgrammingLanguage(draft.getProgrammingLanguage());
        dto.setDescription(draft.getDescription());
        dto.setStatus(draft.getStatus().name());
        dto.setCreatedAt(draft.getCreatedAt());
        dto.setUpdatedAt(draft.getUpdatedAt());
        return dto;
    }
}
