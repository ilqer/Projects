package com.artifactcomparator.service;

import com.artifactcomparator.model.*;
import com.artifactcomparator.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIArtifactGenerationService {
    
    private final AIArtifactGenerationJobRepository jobRepository;
    private final AIArtifactDraftRepository draftRepository;
    private final UserRepository userRepository;
    private final ArtifactRepository artifactRepository;
    private final GeminiApiService geminiApiService;
    private final ObjectMapper objectMapper;
    private final TagRepository tagRepository;
    
    @Value("${app.artifacts.storage-dir}")
    private String storageDir;
    
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
    
    @Transactional
    public AIArtifactGenerationJob createGenerationJob(
            String description,
            String programmingLanguage,
            String complexity,
            Boolean includeComments,
            Boolean followBestPractices,
            Boolean addErrorHandling
    ) {
        User researcher = getCurrentUser();
        
        AIArtifactGenerationJob job = AIArtifactGenerationJob.builder()
                .researcher(researcher)
                .description(description)
                .programmingLanguage(programmingLanguage)
                .complexity(complexity)
                .includeComments(includeComments)
                .followBestPractices(followBestPractices)
                .addErrorHandling(addErrorHandling)
                .status(AIArtifactGenerationJob.JobStatus.PENDING)
                .build();
        
        job = jobRepository.save(job);
        
        // Process asynchronously
        processGenerationJob(job.getId(), researcher.getGeminiApiKey());
        
        return job;
    }
    
    @Async
    @Transactional
    public void processGenerationJob(Long jobId, String apiKey) {
        Optional<AIArtifactGenerationJob> jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            log.error("Job {} not found", jobId);
            return;
        }
        
        AIArtifactGenerationJob job = jobOpt.get();
        
        try {
            job.setStatus(AIArtifactGenerationJob.JobStatus.PROCESSING);
            jobRepository.save(job);
            
            String prompt = buildPrompt(job);
            log.info("Generating artifact with prompt: {}", prompt);
            
            String generatedCode = geminiApiService.generateArtifact(apiKey, prompt);
            
            // Create draft
            AIArtifactDraft draft = AIArtifactDraft.builder()
                    .job(job)
                    .researcher(job.getResearcher())
                    .name(generateArtifactName(job))
                    .content(generatedCode)
                    .programmingLanguage(job.getProgrammingLanguage())
                    .description(job.getDescription())
                    .status(AIArtifactDraft.DraftStatus.PENDING)
                    .build();
            
            draftRepository.save(draft);
            
            job.setStatus(AIArtifactGenerationJob.JobStatus.COMPLETED);
            jobRepository.save(job);
            
            log.info("Successfully generated artifact for job {}", jobId);
            
        } catch (Exception e) {
            log.error("Error generating artifact for job {}: {}", jobId, e.getMessage(), e);
            job.setStatus(AIArtifactGenerationJob.JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            jobRepository.save(job);
        }
    }
    
    private String buildPrompt(AIArtifactGenerationJob job) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a ").append(job.getProgrammingLanguage()).append(" code artifact based on the following requirements:\n\n");
        prompt.append("Description: ").append(job.getDescription()).append("\n");
        prompt.append("Complexity Level: ").append(job.getComplexity()).append("\n\n");
        
        prompt.append("Requirements:\n");
        if (job.getIncludeComments()) {
            prompt.append("- Include detailed comments explaining the code\n");
        }
        if (job.getFollowBestPractices()) {
            prompt.append("- Follow ").append(job.getProgrammingLanguage()).append(" best practices and coding standards\n");
        }
        if (job.getAddErrorHandling()) {
            prompt.append("- Include proper error handling and exception management\n");
        }
        
        prompt.append("\nProvide ONLY the code without any markdown formatting, explanations, or additional text. ");
        prompt.append("Just return the raw ").append(job.getProgrammingLanguage()).append(" code that can be directly saved to a file.");
        
        return prompt.toString();
    }
    
    private String generateArtifactName(AIArtifactGenerationJob job) {
        String extension = getFileExtension(job.getProgrammingLanguage());
        String baseName = job.getDescription()
                .replaceAll("[^a-zA-Z0-9\\s]", "")
                .replaceAll("\\s+", "_")
                .toLowerCase();
        
        if (baseName.length() > 50) {
            baseName = baseName.substring(0, 50);
        }
        
        return baseName + "." + extension;
    }
    
    private String getFileExtension(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> "java";
            case "python" -> "py";
            case "javascript" -> "js";
            case "typescript" -> "ts";
            case "c++" -> "cpp";
            case "c#" -> "cs";
            case "go" -> "go";
            case "rust" -> "rs";
            default -> "txt";
        };
    }
    
    @Transactional(readOnly = true)
    public List<AIArtifactDraft> getPendingDrafts() {
        User researcher = getCurrentUser();
        return draftRepository.findByResearcherAndStatusInOrderByCreatedAtDesc(
                researcher,
                List.of(AIArtifactDraft.DraftStatus.PENDING, AIArtifactDraft.DraftStatus.EDITED)
        );
    }
    
    @Transactional
    public AIArtifactDraft updateDraft(Long draftId, String name, String content, String description) {
        AIArtifactDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found"));
        
        User researcher = getCurrentUser();
        if (!draft.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only edit your own drafts");
        }
        
        if (name != null && !name.trim().isEmpty()) {
            draft.setName(name);
        }
        if (content != null && !content.trim().isEmpty()) {
            draft.setContent(content);
        }
        if (description != null) {
            draft.setDescription(description);
        }
        
        draft.setStatus(AIArtifactDraft.DraftStatus.EDITED);
        return draftRepository.save(draft);
    }
    
    @Transactional
    public Artifact approveDraft(Long draftId) {
        log.info("Attempting to approve draft with ID: {}", draftId);
        AIArtifactDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found with ID: " + draftId));
        
        User researcher = getCurrentUser();
        log.info("Current user ID: {}, Draft researcher ID: {}", researcher.getId(), draft.getResearcher().getId());
        if (!draft.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("User mismatch: You can only approve your own drafts.");
        }
        
        // Ensure storage directory exists
        try {
            Files.createDirectories(Path.of(storageDir));
        } catch (IOException e) {
            throw new RuntimeException("Failed to create storage directory", e);
        }
        
        // Generate filename with extension
        String extension = getFileExtension(draft.getProgrammingLanguage());
        String originalFilename = draft.getName() + "." + extension;
        String storedFilename = UUID.randomUUID() + "-" + sanitizeFilename(originalFilename);
        Path filePath = Path.of(storageDir).resolve(storedFilename);
        
        // Write content to file
        try {
            Files.writeString(filePath, draft.getContent(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write artifact file", e);
        }
        
        // Calculate SHA-256 hash
        String sha256;
        try {
            sha256 = calculateSHA256(filePath);
        } catch (Exception e) {
            // Clean up file if hashing fails
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {}
            throw new RuntimeException("Failed to calculate file hash", e);
        }
        
        // Create artifact from draft
        Artifact artifact = Artifact.builder()
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .contentType(getContentType(draft.getProgrammingLanguage()))
                .sizeBytes(draft.getContent().getBytes(StandardCharsets.UTF_8).length)
                .sha256(sha256)
                .uploadedBy(researcher)
                .build();
        
        List<Tag> aiTags = tagRepository.findByName("ai-created");
        Tag aiTag;
        if (!aiTags.isEmpty()) {
            aiTag = aiTags.get(0);
        } else {
            aiTag = tagRepository.save(Tag.builder()
                .name("ai-created")
                .color("#6366F1")
                .description("Automatically assigned to artifacts created by AI.")
                .createdBy(researcher)
                .build()
            );
        }
        artifact.addTag(aiTag);
        
        artifact = artifactRepository.save(artifact);

        draft.setStatus(AIArtifactDraft.DraftStatus.APPROVED);
        draftRepository.save(draft);
        
        log.info("Draft {} approved and saved as artifact {} at {}", draftId, artifact.getId(), filePath);
        
        return artifact;
    }
    
    private String sanitizeFilename(String filename) {
        // Remove or replace unsafe characters
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
    
    private String calculateSHA256(Path filePath) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] fileBytes = Files.readAllBytes(filePath);
        byte[] hashBytes = digest.digest(fileBytes);
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hashBytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
    
    private String getContentType(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> "text/x-java";
            case "python" -> "text/x-python";
            case "javascript" -> "text/javascript";
            case "typescript" -> "text/typescript";
            default -> "text/plain";
        };
    }
    
    @Transactional
    public AIArtifactDraft discardDraft(Long draftId) {
        AIArtifactDraft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found"));
        
        User researcher = getCurrentUser();
        if (!draft.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only discard your own drafts");
        }
        
        draft.setStatus(AIArtifactDraft.DraftStatus.DISCARDED);
        return draftRepository.save(draft);
    }
    
    @Transactional(readOnly = true)
    public List<AIArtifactGenerationJob> getMyJobs() {
        User researcher = getCurrentUser();
        return jobRepository.findByResearcherOrderByCreatedAtDesc(researcher);
    }
    
    @Transactional(readOnly = true)
    public AIArtifactGenerationJob getJobById(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
    }
    
    @Data
    public static class DraftUpdate {
        private String name;
        private String content;
        private String description;
    }
}
