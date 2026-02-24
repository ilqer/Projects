package com.artifactcomparator.controller;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.model.AIQuestionDraft;
import com.artifactcomparator.model.AIQuestionGenerationJob;
import com.artifactcomparator.service.AIQuestionGenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai-questions")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class AIQuestionController {
    
    private static final Logger logger = LoggerFactory.getLogger(AIQuestionController.class);
    
    private final AIQuestionGenerationService aiQuestionGenerationService;
    
    @PostMapping("/generate")
    public ResponseEntity<?> generateQuestions(@Valid @RequestBody AIQuestionGenerationRequestDTO request) {
        logger.info("AI question generation request: topic={}, difficulty={}, count={}", 
                request.getTopic(), request.getDifficulty(), request.getNumberOfQuestions());
        try {
            AIQuestionGenerationJob job = aiQuestionGenerationService.createGenerationJob(
                    request.getQuestionnaireId(),
                    request.getTopic(),
                    request.getDifficulty(),
                    request.getNumberOfQuestions()
            );
            
            AIQuestionGenerationJobDTO dto = convertJobToDTO(job);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            logger.error("Error creating generation job: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/jobs")
    public ResponseEntity<List<AIQuestionGenerationJobDTO>> getMyJobs() {
        try {
            List<AIQuestionGenerationJob> jobs = aiQuestionGenerationService.getMyJobs();
            List<AIQuestionGenerationJobDTO> dtos = jobs.stream()
                    .map(this::convertJobToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Error fetching jobs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJobById(@PathVariable Long jobId) {
        try {
            AIQuestionGenerationJob job = aiQuestionGenerationService.getJobById(jobId);
            return ResponseEntity.ok(convertJobToDTO(job));
        } catch (Exception e) {
            logger.error("Error fetching job {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/jobs/{jobId}/drafts")
    public ResponseEntity<?> getDraftsByJob(@PathVariable Long jobId) {
        try {
            List<AIQuestionDraft> drafts = aiQuestionGenerationService.getDraftsByJob(jobId);
            List<AIQuestionDraftDTO> dtos = drafts.stream()
                    .map(this::convertDraftToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Error fetching drafts for job {}: {}", jobId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/questionnaires/{questionnaireId}/pending-drafts")
    public ResponseEntity<?> getPendingDrafts(@PathVariable Long questionnaireId) {
        try {
            List<AIQuestionDraft> drafts = aiQuestionGenerationService.getPendingDrafts(questionnaireId);
            List<AIQuestionDraftDTO> dtos = drafts.stream()
                    .map(this::convertDraftToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Error fetching pending drafts: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/drafts/{draftId}/approve")
    public ResponseEntity<?> approveDraft(@PathVariable Long draftId) {
        logger.info("Approving draft {}", draftId);
        try {
            AIQuestionDraft draft = aiQuestionGenerationService.approveDraft(draftId);
            return ResponseEntity.ok(convertDraftToDTO(draft));
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
            AIQuestionDraft draft = aiQuestionGenerationService.discardDraft(draftId);
            return ResponseEntity.ok(convertDraftToDTO(draft));
        } catch (Exception e) {
            logger.error("Error discarding draft {}: {}", draftId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/drafts/{draftId}")
    public ResponseEntity<?> updateDraft(@PathVariable Long draftId, 
                                        @Valid @RequestBody UpdateDraftRequestDTO request) {
        logger.info("Updating draft {}", draftId);
        try {
            List<AIQuestionGenerationService.DraftOptionUpdate> optionUpdates = null;
            if (request.getOptions() != null) {
                optionUpdates = request.getOptions().stream()
                        .map(opt -> {
                            AIQuestionGenerationService.DraftOptionUpdate update = 
                                    new AIQuestionGenerationService.DraftOptionUpdate();
                            update.setOptionText(opt.getOptionText());
                            update.setIsCorrect(opt.getIsCorrect());
                            update.setDisplayOrder(opt.getDisplayOrder());
                            return update;
                        })
                        .collect(Collectors.toList());
            }
            
            AIQuestionDraft draft = aiQuestionGenerationService.updateDraft(
                    draftId,
                    request.getQuestionText(),
                    request.getCorrectAnswer(),
                    request.getPoints(),
                    optionUpdates
            );
            return ResponseEntity.ok(convertDraftToDTO(draft));
        } catch (Exception e) {
            logger.error("Error updating draft {}: {}", draftId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    private AIQuestionGenerationJobDTO convertJobToDTO(AIQuestionGenerationJob job) {
        AIQuestionGenerationJobDTO dto = new AIQuestionGenerationJobDTO();
        dto.setId(job.getId());
        dto.setResearcherId(job.getResearcher().getId());
        dto.setResearcherName(job.getResearcher().getFullName());
        dto.setQuestionnaireId(job.getQuestionnaire().getId());
        dto.setQuestionnaireTitle(job.getQuestionnaire().getTitle());
        dto.setTopic(job.getTopic());
        dto.setDifficulty(job.getDifficulty());
        dto.setNumberOfQuestions(job.getNumberOfQuestions());
        dto.setStatus(job.getStatus());
        dto.setErrorMessage(job.getErrorMessage());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setUpdatedAt(job.getUpdatedAt());
        dto.setCompletedAt(job.getCompletedAt());
        return dto;
    }
    
    private AIQuestionDraftDTO convertDraftToDTO(AIQuestionDraft draft) {
        AIQuestionDraftDTO dto = new AIQuestionDraftDTO();
        dto.setId(draft.getId());
        dto.setJobId(draft.getJob().getId());
        dto.setQuestionnaireId(draft.getQuestionnaire().getId());
        dto.setQuestionText(draft.getQuestionText());
        dto.setType(draft.getType());
        dto.setCorrectAnswer(draft.getCorrectAnswer());
        dto.setPoints(draft.getPoints());
        dto.setDisplayOrder(draft.getDisplayOrder());
        dto.setStatus(draft.getStatus());
        dto.setCreatedAt(draft.getCreatedAt());
        dto.setUpdatedAt(draft.getUpdatedAt());
        
        if (draft.getOptions() != null) {
            List<AIQuestionDraftOptionDTO> optionDTOs = draft.getOptions().stream()
                    .map(opt -> {
                        AIQuestionDraftOptionDTO optDTO = new AIQuestionDraftOptionDTO();
                        optDTO.setId(opt.getId());
                        optDTO.setOptionText(opt.getOptionText());
                        optDTO.setIsCorrect(opt.getIsCorrect());
                        optDTO.setDisplayOrder(opt.getDisplayOrder());
                        return optDTO;
                    })
                    .collect(Collectors.toList());
            dto.setOptions(optionDTOs);
        }
        
        return dto;
    }
}

