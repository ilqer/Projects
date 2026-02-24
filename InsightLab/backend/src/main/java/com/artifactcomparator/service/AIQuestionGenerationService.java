package com.artifactcomparator.service;

import com.artifactcomparator.model.*;
import com.artifactcomparator.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AIQuestionGenerationService {
    
    private static final Logger logger = LoggerFactory.getLogger(AIQuestionGenerationService.class);
    
    private final AIQuestionGenerationJobRepository jobRepository;
    private final AIQuestionDraftRepository draftRepository;
    private final AIQuestionDraftOptionRepository draftOptionRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final UserRepository userRepository;
    private final GeminiApiService geminiApiService;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    
    @Transactional
    public AIQuestionGenerationJob createGenerationJob(Long questionnaireId, String topic, 
                                                       AIQuestionGenerationJob.DifficultyLevel difficulty, 
                                                       Integer numberOfQuestions) {
        User researcher = getCurrentUser();
        
        if (researcher.getRole() != User.Role.RESEARCHER) {
            throw new IllegalStateException("Only researchers can generate AI questions");
        }
        
        if (researcher.getGeminiApiKey() == null || researcher.getGeminiApiKey().trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is required. Please add it in your profile settings.");
        }
        
        Questionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
        
        if (!questionnaire.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only generate questions for your own questionnaires");
        }
        
        AIQuestionGenerationJob job = AIQuestionGenerationJob.builder()
                .researcher(researcher)
                .questionnaire(questionnaire)
                .topic(topic)
                .difficulty(difficulty)
                .numberOfQuestions(numberOfQuestions != null ? numberOfQuestions : 5)
                .status(AIQuestionGenerationJob.JobStatus.PENDING)
                .build();
        
        job = jobRepository.save(job);
        
        // Process asynchronously
        processJobAsync(job.getId());
        
        return job;
    }
    
    @Async
    public void processJobAsync(Long jobId) {
        try {
            processJob(jobId);
        } catch (Exception e) {
            logger.error("Error processing job {}: {}", jobId, e.getMessage(), e);
        }
    }
    
    @Transactional
    public void processJob(Long jobId) {
        AIQuestionGenerationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        
        job.setStatus(AIQuestionGenerationJob.JobStatus.PROCESSING);
        jobRepository.save(job);
        
        try {
            User researcher = job.getResearcher();
            String apiKey = researcher.getGeminiApiKey();
            
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalStateException("Researcher API key not found");
            }
            
            List<GeminiApiService.GeneratedQuestion> generatedQuestions = geminiApiService.generateQuestions(
                    apiKey,
                    job.getTopic(),
                    job.getDifficulty().name(),
                    job.getNumberOfQuestions()
            );
            
            // Save as drafts
            for (int i = 0; i < generatedQuestions.size(); i++) {
                GeminiApiService.GeneratedQuestion genQ = generatedQuestions.get(i);
                
                AIQuestionDraft draft = AIQuestionDraft.builder()
                        .job(job)
                        .questionnaire(job.getQuestionnaire())
                        .questionText(genQ.getQuestionText())
                        .type(genQ.getType())
                        .correctAnswer(genQ.getCorrectAnswer())
                        .points(genQ.getPoints() != null ? genQ.getPoints() : 1)
                        .displayOrder(i)
                        .status(AIQuestionDraft.DraftStatus.PENDING)
                        .build();
                
                draft = draftRepository.save(draft);
                
                // Add options if present
                if (genQ.getOptions() != null) {
                    for (int j = 0; j < genQ.getOptions().size(); j++) {
                        GeminiApiService.GeneratedOption genOpt = genQ.getOptions().get(j);
                        AIQuestionDraftOption option = AIQuestionDraftOption.builder()
                                .draft(draft)
                                .optionText(genOpt.getOptionText())
                                .isCorrect(genOpt.getIsCorrect() != null ? genOpt.getIsCorrect() : false)
                                .displayOrder(j)
                                .build();
                        draftOptionRepository.save(option);
                        draft.addOption(option);
                    }
                }
            }
            
            job.setStatus(AIQuestionGenerationJob.JobStatus.COMPLETED);
            job.setCompletedAt(LocalDateTime.now());
            jobRepository.save(job);
            
        } catch (Exception e) {
            logger.error("Error generating questions for job {}: {}", jobId, e.getMessage(), e);
            job.setStatus(AIQuestionGenerationJob.JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            jobRepository.save(job);
        }
    }
    
    @Transactional(readOnly = true)
    public List<AIQuestionGenerationJob> getMyJobs() {
        User researcher = getCurrentUser();
        return jobRepository.findByResearcherIdOrderByCreatedAtDesc(researcher.getId());
    }
    
    @Transactional(readOnly = true)
    public AIQuestionGenerationJob getJobById(Long jobId) {
        AIQuestionGenerationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        
        User researcher = getCurrentUser();
        if (!job.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only view your own jobs");
        }
        
        return job;
    }
    
    @Transactional(readOnly = true)
    public List<AIQuestionDraft> getDraftsByJob(Long jobId) {
        AIQuestionGenerationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        
        User researcher = getCurrentUser();
        if (!job.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only view your own drafts");
        }
        
        return draftRepository.findByJobIdOrderByDisplayOrderAsc(jobId);
    }
    
    @Transactional(readOnly = true)
    public List<AIQuestionDraft> getPendingDrafts(Long questionnaireId) {
        User researcher = getCurrentUser();
        Questionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
        
        if (!questionnaire.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only view drafts for your own questionnaires");
        }
        
        // Include both PENDING and EDITED statuses so edited drafts remain visible
        return draftRepository.findByQuestionnaireIdAndStatusInOrderByCreatedAtDesc(
                questionnaireId, 
                List.of(AIQuestionDraft.DraftStatus.PENDING, AIQuestionDraft.DraftStatus.EDITED)
        );
    }
    
    @Transactional
    public AIQuestionDraft approveDraft(Long draftId) {
        AIQuestionDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found"));
        
        User researcher = getCurrentUser();
        if (!draft.getQuestionnaire().getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only approve your own drafts");
        }
        
        // Convert draft to actual question
        convertDraftToQuestion(draft);
        
        draft.setStatus(AIQuestionDraft.DraftStatus.APPROVED);
        return draftRepository.save(draft);
    }
    
    @Transactional
    public AIQuestionDraft discardDraft(Long draftId) {
        AIQuestionDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found"));
        
        User researcher = getCurrentUser();
        if (!draft.getQuestionnaire().getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only discard your own drafts");
        }
        
        draft.setStatus(AIQuestionDraft.DraftStatus.DISCARDED);
        return draftRepository.save(draft);
    }
    
    @Transactional
    public AIQuestionDraft updateDraft(Long draftId, String questionText, String correctAnswer, 
                                       Integer points, List<DraftOptionUpdate> options) {
        AIQuestionDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found"));
        
        User researcher = getCurrentUser();
        if (!draft.getQuestionnaire().getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only edit your own drafts");
        }
        
        if (questionText != null && !questionText.trim().isEmpty()) {
            draft.setQuestionText(questionText);
        }
        
        if (correctAnswer != null) {
            draft.setCorrectAnswer(correctAnswer);
        }
        
        if (points != null) {
            draft.setPoints(points);
        }
        
        if (options != null && !options.isEmpty()) {
            // Remove old options
            draft.getOptions().clear();
            draftOptionRepository.deleteAll(draftOptionRepository.findByDraftIdOrderByDisplayOrderAsc(draftId));
            
            // Add new options
            for (int i = 0; i < options.size(); i++) {
                DraftOptionUpdate optUpdate = options.get(i);
                AIQuestionDraftOption option = AIQuestionDraftOption.builder()
                        .draft(draft)
                        .optionText(optUpdate.getOptionText())
                        .isCorrect(optUpdate.getIsCorrect() != null ? optUpdate.getIsCorrect() : false)
                        .displayOrder(optUpdate.getDisplayOrder() != null ? optUpdate.getDisplayOrder() : i)
                        .build();
                draftOptionRepository.save(option);
                draft.addOption(option);
            }
        }
        
        draft.setStatus(AIQuestionDraft.DraftStatus.EDITED);
        return draftRepository.save(draft);
    }
    
    @Transactional
    public Question convertDraftToQuestion(AIQuestionDraft draft) {
        Questionnaire questionnaire = draft.getQuestionnaire();
        
        // Get the highest display order
        int maxDisplayOrder = questionnaire.getQuestions().stream()
                .mapToInt(Question::getDisplayOrder)
                .max()
                .orElse(-1);
        
        Question question = Question.builder()
                .questionText(draft.getQuestionText())
                .type(draft.getType())
                .questionnaire(questionnaire)
                .correctAnswer(draft.getCorrectAnswer())
                .displayOrder(maxDisplayOrder + 1)
                .points(draft.getPoints())
                .version(1)
                .isActive(true)
                .build();
        
        question = questionRepository.save(question);
        
        // Add options
        for (AIQuestionDraftOption draftOpt : draft.getOptions()) {
            QuestionOption option = QuestionOption.builder()
                    .question(question)
                    .optionText(draftOpt.getOptionText())
                    .isCorrect(draftOpt.getIsCorrect())
                    .displayOrder(draftOpt.getDisplayOrder())
                    .build();
            questionOptionRepository.save(option);
            question.addOption(option);
        }
        
        questionnaire.addQuestion(question);
        questionnaireRepository.save(questionnaire);
        
        return question;
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
    
    // Inner class for draft option updates
    @lombok.Data
    public static class DraftOptionUpdate {
        private String optionText;
        private Boolean isCorrect;
        private Integer displayOrder;
    }
}

