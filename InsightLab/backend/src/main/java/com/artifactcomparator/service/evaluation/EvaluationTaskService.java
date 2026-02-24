package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.*;
import com.artifactcomparator.dto.evaluation.EvaluationTaskDetailResponseDTO;
import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.QuizAssignment;
import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.User;
import com.artifactcomparator.model.evaluation.*;
import com.artifactcomparator.model.evaluation.artifact.*;
import com.artifactcomparator.repository.ArtifactRepository;
import com.artifactcomparator.repository.QuizAssignmentRepository;
import com.artifactcomparator.repository.UserRepository;
import com.artifactcomparator.repository.evaluation.*;
import com.artifactcomparator.repository.evaluation.EvaluationSubmissionRepository;
import com.artifactcomparator.repository.evaluation.ScoreEntryRepository;
import com.artifactcomparator.repository.evaluation.EvaluationAnnotationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Collections;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
@RequiredArgsConstructor
public class EvaluationTaskService {

    private final EvaluationTaskRepository taskRepository;
    private final TaskTypeRepository taskTypeRepository;
    private final EvaluationArtifactRepository artifactRepository;
    private final BugReportArtifactRepository bugReportRepository;
    private final CodeCloneArtifactRepository codeCloneRepository;
    private final SolidViolationArtifactRepository solidViolationRepository;
    private final SnapshotArtifactRepository snapshotRepository;
    private final ParticipantTaskAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final ArtifactRepository studyArtifactRepository;
    private final com.artifactcomparator.repository.StudyRepository studyRepository;
    private final com.artifactcomparator.service.NotificationService notificationService;
    private final QuizAssignmentRepository quizAssignmentRepository;
    private final EvaluationSubmissionRepository submissionRepository;
    private final ScoreEntryRepository scoreEntryRepository;
    private final EvaluationAnnotationRepository annotationRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.artifacts.storage-dir}")
    private String artifactStorageDir;

    @Transactional
    public EvaluationTaskDTO createTask(EvaluationTaskCreateDTO dto, Long createdById) {
        // Validate that studyId is provided
        if (dto.getStudyId() == null) {
            throw new IllegalArgumentException("Study ID is required - evaluation tasks must be created within a study");
        }

        // Get creator, task type, and study
        User creator = userRepository.findById(createdById)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        TaskType taskType = null;
        if (dto.getTaskTypeId() != null) {
            taskType = taskTypeRepository.findById(dto.getTaskTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Task type not found"));
        }
        com.artifactcomparator.model.Study study = studyRepository.findById(dto.getStudyId())
            .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Verify that the creator owns the study
        if (!study.getResearcher().getId().equals(createdById)) {
            throw new IllegalArgumentException("You can only create evaluation tasks in your own studies");
        }

        // Create evaluation task
        EvaluationTask task = new EvaluationTask();
        task.setTaskType(taskType);
        task.setStudy(study);
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setInstructions(dto.getInstructions());
        task.setStatus(EvaluationTask.TaskStatus.ACTIVE);
        task.setDueDate(dto.getDueDate());
        task.setCreatedBy(creator);
        task.setAllowHighlight(dto.getAllowHighlight() != null ? dto.getAllowHighlight() : Boolean.TRUE);
        task.setAllowAnnotation(Boolean.TRUE.equals(dto.getAllowAnnotation()));
        task.setAllowTagging(Boolean.TRUE.equals(dto.getAllowTagging()));
        task.setLayoutMode(resolveLayoutMode(dto));
        task.setBlindedMode(Boolean.TRUE.equals(dto.getBlindedMode()));
        if (dto.getArtifactReferences() != null && !dto.getArtifactReferences().isEmpty()) {
            task.setArtifacts(dto.getArtifactReferences());
        }
        if (dto.getCriteria() != null && !dto.getCriteria().isEmpty()) {
            task.setCriteria(dto.getCriteria());
        }

        if (taskType != null && dto.getArtifacts() != null) {
            if (taskType.getArtifactType() == TaskType.ArtifactType.CODE_CLONE) {
                for (ArtifactCreateDTO artifactCreateDTO : dto.getArtifacts()) {
                    JsonNode data = artifactCreateDTO.getData();
                    if (data != null && data.hasNonNull("codeSnippet1") && data.hasNonNull("codeSnippet2")) {
                        task.setCloneOriginalCodeContent(data.get("codeSnippet1").asText());
                        task.setCloneCloneCodeContent(data.get("codeSnippet2").asText());
                        break;
                    }
                }
            } else if (taskType.getArtifactType() == TaskType.ArtifactType.BUG_REPORT) {
                for (ArtifactCreateDTO artifactCreateDTO : dto.getArtifacts()) {
                    JsonNode data = artifactCreateDTO.getData();
                    if (data != null && data.hasNonNull("bugReportJson")) {
                        task.setBugReportJson(data.get("bugReportJson").asText());
                        break;
                    }
                }
            } else if (taskType.getArtifactType() == TaskType.ArtifactType.SOLID_VIOLATION) {
                for (ArtifactCreateDTO artifactCreateDTO : dto.getArtifacts()) {
                    JsonNode data = artifactCreateDTO.getData();
                    if (data != null && data.hasNonNull("solidJson")) {
                        task.setSolidJson(data.get("solidJson").asText());
                        break;
                    }
                }
            }
        }

        task = taskRepository.save(task);
        System.out.println("Created task with ID: " + task.getId() + ", DueDate: " + dto.getDueDate());

        // Create artifacts
        if (dto.getArtifacts() != null && !dto.getArtifacts().isEmpty()) {
            final EvaluationTask finalTask = task;
            int displayOrder = 1;

            for (var artifactDto : dto.getArtifacts()) {
                createArtifact(finalTask, artifactDto, displayOrder++);
            }

            if (Boolean.TRUE.equals(task.getBlindedMode())) {
                initializeBlindedOrder(task, dto.getArtifacts().size());
            }
        }

        // Create assignments if participant IDs provided
        if (dto.getParticipantIds() != null && !dto.getParticipantIds().isEmpty()) {
            for (Long participantId : dto.getParticipantIds()) {
                createAssignment(task, participantId, createdById, dto.getDueDate());
            }
        }

        return convertToDTO(task);
    }

    private void initializeBlindedOrder(EvaluationTask task, int artifactCount) {
        if (artifactCount <= 0) {
            return;
        }
        List<Integer> existing = task.getBlindedOrder();
        if (existing != null && existing.size() == artifactCount) {
            return;
        }
        List<Integer> order = IntStream.rangeClosed(1, artifactCount)
            .boxed()
            .collect(Collectors.toList());
        Collections.shuffle(order);
        task.setBlindedOrder(order);
        taskRepository.save(task);
    }

    private void createArtifact(EvaluationTask task, ArtifactCreateDTO artifactDto, int displayOrder) {
        if ("SNAPSHOT".equals(artifactDto.getArtifactType())) {
            createSnapshotArtifact(task, artifactDto, displayOrder);
            return;
        }

        ResolvedArtifactData resolvedData = resolveArtifactData(artifactDto);

        // Create specific artifact type (JPA JOINED inheritance handles parent table)
        switch (artifactDto.getArtifactType()) {
            case "BUG_REPORT":
                createBugReportArtifact(task, resolvedData, displayOrder);
                break;
            case "CODE_CLONE":
                createCodeCloneArtifact(task, resolvedData, displayOrder);
                break;
            case "SOLID_VIOLATION":
                createSolidViolationArtifact(task, resolvedData, displayOrder);
                break;
            default:
                throw new IllegalArgumentException("Unsupported artifact type: " + artifactDto.getArtifactType());
        }
    }

    private void createBugReportArtifact(EvaluationTask task, ResolvedArtifactData resolvedData, int displayOrder) {
        BugReportArtifact artifact = new BugReportArtifact();
        // Set parent fields (from EvaluationArtifact)
        artifact.setArtifactType(TaskType.ArtifactType.BUG_REPORT);
        artifact.setEvaluationTask(task);
        artifact.setDisplayOrder(displayOrder);

        JsonNode data = resolvedData.data();

        JsonNode bugContentNode = data;
        if (data.hasNonNull("bugReportJson")) {
            String bugJson = data.get("bugReportJson").asText();
            if (bugJson == null || bugJson.trim().isEmpty()) {
                throw new IllegalArgumentException("Bug report JSON is required");
            }
            try {
                bugContentNode = objectMapper.readTree(bugJson);
            } catch (IOException e) {
                throw new IllegalArgumentException("Invalid bug report JSON payload", e);
            }
        }

        String title = extractFirstNonEmpty(bugContentNode, "title", "bugTitle", "summary", "name");
        if (title == null || title.isBlank()) {
            title = "Bug Report";
        }
        String description = extractFirstNonEmpty(bugContentNode, "description", "details", "actualBehavior", "expectedBehavior");
        if (description == null || description.isBlank()) {
            description = bugContentNode.isNull() ? "Bug report details" : bugContentNode.toString();
        }

        artifact.setTitle(title);
        artifact.setDescription(description);

        if (bugContentNode.has("severity")) artifact.setSeverity(bugContentNode.get("severity").asText());
        if (bugContentNode.has("priority")) artifact.setPriority(bugContentNode.get("priority").asText());
        if (bugContentNode.has("reporter")) artifact.setReporter(bugContentNode.get("reporter").asText());
        artifact.setAdditionalData(bugContentNode);

        attachSourceMetadata(artifact, resolvedData.sourceArtifactId());
        bugReportRepository.save(artifact);
    }

    private void createCodeCloneArtifact(EvaluationTask task, ResolvedArtifactData resolvedData, int displayOrder) {
        CodeCloneArtifact artifact = new CodeCloneArtifact();
        // Set parent fields (from EvaluationArtifact)
        artifact.setArtifactType(TaskType.ArtifactType.CODE_CLONE);
        artifact.setEvaluationTask(task);
        artifact.setDisplayOrder(displayOrder);

        JsonNode data = resolvedData.data();

        // Set child fields (specific to CodeCloneArtifact)
        // Required fields with validation
        if (!data.has("codeSnippet1") || data.get("codeSnippet1").asText().trim().isEmpty()) {
            throw new IllegalArgumentException("Original code (codeSnippet1) is required");
        }
        if (!data.has("codeSnippet2") || data.get("codeSnippet2").asText().trim().isEmpty()) {
            throw new IllegalArgumentException("Clone code (codeSnippet2) is required");
        }

        artifact.setCodeSnippet1(data.get("codeSnippet1").asText());
        artifact.setCodeSnippet2(data.get("codeSnippet2").asText());

        // Optional fields
        if (data.has("programmingLanguage")) {
            artifact.setLanguage(data.get("programmingLanguage").asText());
        } else if (data.has("language")) {
            artifact.setLanguage(data.get("language").asText());
        }

        if (data.has("similarityScore")) {
            artifact.setSimilarityScore(data.get("similarityScore").asDouble());
        }

        attachSourceMetadata(artifact, resolvedData.sourceArtifactId());
        codeCloneRepository.save(artifact);
    }

    private void createSolidViolationArtifact(EvaluationTask task, ResolvedArtifactData resolvedData, int displayOrder) {
        SolidViolationArtifact artifact = new SolidViolationArtifact();
        // Set parent fields (from EvaluationArtifact)
        artifact.setArtifactType(TaskType.ArtifactType.SOLID_VIOLATION);
        artifact.setEvaluationTask(task);
        artifact.setDisplayOrder(displayOrder);

        JsonNode data = resolvedData.data();
        JsonNode solidContent = data;

        if (data.hasNonNull("solidJson")) {
            String solidJson = data.get("solidJson").asText();
            if (solidJson == null || solidJson.trim().isEmpty()) {
                throw new IllegalArgumentException("SOLID code JSON is required");
            }
            solidContent = parseJsonString(solidJson, "SOLID code artifact JSON");
        }

        if (solidContent == null || solidContent.isNull()) {
            throw new IllegalArgumentException("SOLID code artifact data is required");
        }

        String codeSnippet = extractFirstNonEmpty(solidContent, "codeSnippet", "code", "codeExample", "snippet");
        if ((codeSnippet == null || codeSnippet.isBlank()) && data.hasNonNull("codeSnippet")) {
            codeSnippet = data.get("codeSnippet").asText();
        }
        if (codeSnippet == null || codeSnippet.trim().isEmpty()) {
            throw new IllegalArgumentException("Code snippet is required for SOLID violation");
        }
        artifact.setCodeSnippet(codeSnippet);

        String language = extractFirstNonEmpty(solidContent, "language", "programmingLanguage", "lang");
        if (language == null && data.hasNonNull("language")) {
            language = data.get("language").asText();
        }
        if (language == null && data.hasNonNull("programmingLanguage")) {
            language = data.get("programmingLanguage").asText();
        }
        artifact.setLanguage(language);

        if (solidContent.has("violationType")) {
            artifact.setCorrectViolationType(solidContent.get("violationType").asText());
        } else if (data.has("violationType")) {
            artifact.setCorrectViolationType(data.get("violationType").asText());
        }

        if (solidContent.has("llmAnalysis")) {
            artifact.setLlmAnalysis(solidContent.get("llmAnalysis").asText());
        } else if (data.has("llmAnalysis")) {
            artifact.setLlmAnalysis(data.get("llmAnalysis").asText());
        }

        if (solidContent.has("llmSuggestedFix")) {
            artifact.setLlmSuggestedFix(solidContent.get("llmSuggestedFix").asText());
        } else if (data.has("llmSuggestedFix")) {
            artifact.setLlmSuggestedFix(data.get("llmSuggestedFix").asText());
        }

        attachSourceMetadata(artifact, resolvedData.sourceArtifactId());
        artifact.setAdditionalData(solidContent);
        solidViolationRepository.save(artifact);
    }

    private void createSnapshotArtifact(EvaluationTask task, ArtifactCreateDTO dto, int displayOrder) {
        SnapshotArtifact artifact = new SnapshotArtifact();
        // Set parent fields (from EvaluationArtifact)
        artifact.setArtifactType(TaskType.ArtifactType.SNAPSHOT);
        artifact.setEvaluationTask(task);
        artifact.setDisplayOrder(displayOrder);

        // Set child fields (specific to SnapshotArtifact)
        // Required fields with validation - THREE IMAGES ARE REQUIRED
        if (!dto.getData().has("referenceImageId") || dto.getData().get("referenceImageId").asText().trim().isEmpty()) {
            throw new IllegalArgumentException("Reference image is required for snapshot artifact");
        }
        if (!dto.getData().has("failureImageId") || dto.getData().get("failureImageId").asText().trim().isEmpty()) {
            throw new IllegalArgumentException("Failure image is required for snapshot artifact");
        }
        if (!dto.getData().has("diffImageId") || dto.getData().get("diffImageId").asText().trim().isEmpty()) {
            throw new IllegalArgumentException("Diff image is required for snapshot artifact");
        }

        try {
            artifact.setReferenceImageId(java.util.UUID.fromString(dto.getData().get("referenceImageId").asText()));
            artifact.setFailureImageId(java.util.UUID.fromString(dto.getData().get("failureImageId").asText()));
            artifact.setDiffImageId(java.util.UUID.fromString(dto.getData().get("diffImageId").asText()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid image ID format for snapshot artifact");
        }

        // Optional fields
        if (dto.getData().has("testName")) {
            artifact.setTestName(dto.getData().get("testName").asText());
        }
        if (dto.getData().has("componentName")) {
            artifact.setComponentName(dto.getData().get("componentName").asText());
        }
        if (dto.getData().has("testFramework")) {
            artifact.setComponentName(dto.getData().get("testFramework").asText());
        }

        snapshotRepository.save(artifact);
    }

    private ResolvedArtifactData resolveArtifactData(ArtifactCreateDTO dto) {
        JsonNode data = dto.getData();
        UUID sourceId = null;

        if (data != null && data.hasNonNull("studyArtifactId")) {
            sourceId = UUID.fromString(data.get("studyArtifactId").asText());
            data = loadStudyArtifactJson(sourceId);
        }

        if (data == null) {
            throw new IllegalArgumentException("Artifact data is required for type " + dto.getArtifactType());
        }

        return new ResolvedArtifactData(data, sourceId);
    }

    private JsonNode loadStudyArtifactJson(UUID artifactId) {
        Artifact artifact = studyArtifactRepository.findById(artifactId)
            .orElseThrow(() -> new IllegalArgumentException("Study artifact not found: " + artifactId));

        if (artifactStorageDir == null || artifactStorageDir.isBlank()) {
            throw new IllegalStateException("Artifact storage directory is not configured");
        }

        Path filePath = Paths.get(artifactStorageDir, artifact.getStoredFilename());
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Artifact file not found on disk: " + artifact.getOriginalFilename());
        }

        try {
            String content = Files.readString(filePath);
            if (content == null || content.trim().isEmpty()) {
                throw new IllegalArgumentException("Artifact file is empty: " + artifact.getOriginalFilename());
            }
            return objectMapper.readTree(content);
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read artifact content: " + artifact.getOriginalFilename(), e);
        }
    }

    private void attachSourceMetadata(EvaluationArtifact artifact, UUID sourceId) {
        if (sourceId == null) {
            return;
        }

        ObjectNode metadataNode = objectMapper.createObjectNode();
        metadataNode.put("sourceArtifactId", sourceId.toString());
        artifact.setMetadata(metadataNode);
    }

    private record ResolvedArtifactData(JsonNode data, UUID sourceArtifactId) { }

    private String extractFirstNonEmpty(JsonNode node, String... keys) {
        if (node == null || keys == null) {
            return null;
        }
        for (String key : keys) {
            if (node.hasNonNull(key)) {
                String value = node.get(key).asText();
                if (value != null && !value.trim().isEmpty()) {
                    return value;
                }
            }
        }
        return null;
    }

    private JsonNode parseJsonString(String json, String label) {
        try {
            return objectMapper.readTree(json);
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid JSON format for " + label, e);
        }
    }

    private void createAssignment(EvaluationTask task, Long participantId, Long assignedById, LocalDateTime dueDate) {
        User participant = userRepository.findById(participantId)
            .orElseThrow(() -> new IllegalArgumentException("Participant not found"));
        User assignedBy = userRepository.findById(assignedById)
            .orElseThrow(() -> new IllegalArgumentException("Assigner not found"));
        enforceParticipantEligibility(task.getStudy(), participant);

        ParticipantTaskAssignment assignment = new ParticipantTaskAssignment();
        assignment.setEvaluationTask(task);
        assignment.setParticipant(participant);
        assignment.setAssignedBy(assignedBy);
        assignment.setStatus(ParticipantTaskAssignment.AssignmentStatus.PENDING);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setDueDate(dueDate);

        assignment = assignmentRepository.save(assignment);
        System.out.println("Created assignment with ID: " + assignment.getId() + " for participant: " + participant.getUsername() + ", status: " + assignment.getStatus());

        // Create notification for participant
        String notificationTitle = "New Evaluation Task Assigned";
        String notificationMessage = String.format(
            "You have been assigned a new evaluation task: '%s' by %s.%s",
            task.getTitle(),
            assignedBy.getFullName(),
            dueDate != null ? " Due: " + dueDate.toLocalDate() : ""
        );

        try {
            notificationService.createNotification(
                participant,
                assignedBy,
                com.artifactcomparator.model.Notification.NotificationType.EVALUATION_TASK_ASSIGNED,
                notificationTitle,
                notificationMessage,
                com.artifactcomparator.model.Notification.RelatedEntityType.EVALUATION_TASK,
                task.getId()
            );
            System.out.println("Created notification for participant: " + participant.getUsername());
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void enforceParticipantEligibility(Study study, User participant) {
        if (study == null || participant == null) {
            return;
        }
        
        // Find the quiz assignment for this study and participant
        java.util.Optional<QuizAssignment> assignmentOpt = quizAssignmentRepository
                .findByStudyIdAndParticipantIdAndStatus(
                        study.getId(),
                        participant.getId(),
                        QuizAssignment.AssignmentStatus.COMPLETED
                );
        
        if (assignmentOpt.isEmpty()) {
            String displayName = participant.getFullName() != null ? participant.getFullName() : participant.getEmail();
            throw new IllegalStateException(
                    String.format("%s must complete the study quiz before receiving evaluation tasks",
                            displayName != null ? displayName : "This participant"));
        }
        
        QuizAssignment assignment = assignmentOpt.get();
        
        // Apply different eligibility rules based on quiz type
        com.artifactcomparator.model.Questionnaire questionnaire = assignment.getQuestionnaire();
        if (questionnaire.getType() == com.artifactcomparator.model.Questionnaire.QuestionnaireType.COMPETENCY) {
            // COMPETENCY quiz: require quizPassed == true
            if (!Boolean.TRUE.equals(assignment.getPassed())) {
                String displayName = participant.getFullName() != null ? participant.getFullName() : participant.getEmail();
                throw new IllegalStateException(
                        String.format("%s must pass the competency quiz before receiving evaluation tasks",
                                displayName != null ? displayName : "This participant"));
            }
        } else {
            // BACKGROUND quiz: require quizCompleted == true (assignment status is COMPLETED)
            // This is already checked above, so participant is eligible
        }
    }

    @Transactional(readOnly = true)
    public List<EvaluationTaskDTO> getAllTasks(Long createdById) {
        User creator = userRepository.findById(createdById)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return taskRepository.findByCreatedBy(creator).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EvaluationTaskDTO getTaskById(Long id) {
        EvaluationTask task = taskRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        return convertToDTO(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    @Transactional
    public void addParticipants(Long taskId, List<Long> participantIds, LocalDateTime dueDate, Long researcherId) {
        if (participantIds == null || participantIds.isEmpty()) {
            throw new IllegalArgumentException("participantIds cannot be empty");
        }

        EvaluationTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Evaluation task not found"));

        if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(researcherId)) {
            throw new IllegalStateException("You are not authorized to modify this evaluation task");
        }

        LocalDateTime effectiveDueDate = dueDate != null ? dueDate : task.getDueDate();

        for (Long participantId : participantIds) {
            if (assignmentRepository.existsByEvaluationTaskIdAndParticipantId(taskId, participantId)) {
                continue;
            }
            createAssignment(task, participantId, researcherId, effectiveDueDate);
        }
    }

    @Transactional(readOnly = true)
    public List<ParticipantAssignmentDTO> getTaskAssignments(Long taskId) {
        return assignmentRepository.findByEvaluationTaskId(taskId).stream()
            .map(this::convertAssignmentToDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public void removeTaskParticipant(Long taskId, Long assignmentId, Long researcherId) {
        EvaluationTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Evaluation task not found"));

        // Verify that the researcher owns the task
        if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(researcherId)) {
            throw new IllegalStateException("Only the task owner can remove participants");
        }

        ParticipantTaskAssignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        // Verify that the assignment belongs to this task
        if (!assignment.getEvaluationTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Assignment does not belong to this task");
        }

        // Delete related data: submission, scores, annotations
        submissionRepository.findByAssignmentId(assignmentId).ifPresent(submissionRepository::delete);
        scoreEntryRepository.findByAssignmentId(assignmentId).forEach(scoreEntryRepository::delete);
        annotationRepository.findByAssignmentId(assignmentId).forEach(annotationRepository::delete);

        // Delete the assignment (this will cascade delete the submission if cascade is configured)
        assignmentRepository.delete(assignment);
    }

    @Transactional(readOnly = true)
    public EvaluationTaskDetailResponseDTO getTaskDetail(Long taskId, Long requesterId) {
        EvaluationTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Evaluation task not found"));

        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isOwner = task.getCreatedBy() != null && task.getCreatedBy().getId().equals(requesterId);
        boolean isAssigned = assignmentRepository.existsByEvaluationTaskIdAndParticipantId(taskId, requesterId);
        boolean isAdmin = requester.getRole() == User.Role.ADMIN;

        if (!isOwner && !isAssigned && !isAdmin) {
            throw new IllegalStateException("You are not authorized to view this evaluation task");
        }

        EvaluationTaskDTO taskDTO = convertToDTO(task);
        List<ParticipantAssignmentDTO> assignments = assignmentRepository.findByEvaluationTaskId(taskId).stream()
            .map(this::convertAssignmentToDTO)
            .toList();

        return EvaluationTaskDetailResponseDTO.builder()
            .task(taskDTO)
            .artifactReferences(task.getArtifacts())
            .criteria(task.getCriteria())
            .assignments(assignments)
            .build();
    }

    private EvaluationTaskDTO convertToDTO(EvaluationTask task) {
        return EvaluationTaskDTO.builder()
            .id(task.getId())
            .taskTypeId(task.getTaskType() != null ? task.getTaskType().getId() : null)
            .studyId(task.getStudy() != null ? task.getStudy().getId() : null)
            .title(task.getTitle())
            .description(task.getDescription())
            .instructions(task.getInstructions())
            .status(task.getStatus().name())
            .dueDate(task.getDueDate())
            .createdById(task.getCreatedBy().getId())
            .createdByName(task.getCreatedBy().getFullName())
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

    private ParticipantAssignmentDTO convertAssignmentToDTO(ParticipantTaskAssignment assignment) {
        // Get participant level from latest completed quiz assignment
        String participantLevel = null;
        if (assignment.getEvaluationTask().getStudy() != null) {
            java.util.Optional<QuizAssignment> latestQuiz = quizAssignmentRepository
                    .findTopByStudyIdAndParticipantIdAndStatusOrderByCompletedAtDesc(
                            assignment.getEvaluationTask().getStudy().getId(),
                            assignment.getParticipant().getId(),
                            QuizAssignment.AssignmentStatus.COMPLETED
                    );
            
            if (latestQuiz.isPresent() && Boolean.TRUE.equals(latestQuiz.get().getPassed())) {
                if (latestQuiz.get().getLevel() != null) {
                    participantLevel = latestQuiz.get().getLevel().name();
                } else {
                    // Default to BEGINNER if level is null but quiz passed
                    participantLevel = "BEGINNER";
                }
            }
        }
        
        return ParticipantAssignmentDTO.builder()
            .id(assignment.getId())
            .evaluationTaskId(assignment.getEvaluationTask().getId())
            .evaluationTaskTitle(assignment.getEvaluationTask().getTitle())
            .participantId(assignment.getParticipant().getId())
            .participantName(assignment.getParticipant().getFullName())
            .participantEmail(assignment.getParticipant().getEmail())
            .participantUsername(assignment.getParticipant().getUsername())
            .assignedById(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getId() : null)
            .assignedByName(assignment.getAssignedBy() != null ? assignment.getAssignedBy().getFullName() : null)
            .status(assignment.getStatus().name())
            .assignedAt(assignment.getAssignedAt())
            .dueDate(assignment.getDueDate())
            .completedAt(assignment.getSubmittedAt())
            .completedCount(null)  // TODO: Calculate from responses when implemented
            .totalCount(null)  // TODO: Calculate from task artifacts when implemented
            .participantLevel(participantLevel)
            .build();
    }

    private EvaluationTask.LayoutMode resolveLayoutMode(EvaluationTaskCreateDTO dto) {
        if (dto.getLayoutMode() != null && !dto.getLayoutMode().isBlank()) {
            try {
                return EvaluationTask.LayoutMode.valueOf(dto.getLayoutMode().toUpperCase().replace("-", "_"));
            } catch (IllegalArgumentException ignored) {
                // Fallback to automatic determination
            }
        }

        int artifactCount = 0;
        if (dto.getArtifactReferences() != null) {
            artifactCount = dto.getArtifactReferences().size();
        } else if (dto.getArtifacts() != null) {
            artifactCount = dto.getArtifacts().size();
        }

        if (artifactCount <= 1) {
            return EvaluationTask.LayoutMode.SINGLE;
        }
        if (artifactCount == 2) {
            return EvaluationTask.LayoutMode.SIDE_BY_SIDE;
        }
        return EvaluationTask.LayoutMode.THREE_WAY;
    }

    /**
     * Export task participants as PDF
     */
    @Transactional(readOnly = true)
    public byte[] exportTaskParticipantsAsPDF(Long taskId) throws IOException {
        EvaluationTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        List<ParticipantAssignmentDTO> participants = getTaskAssignments(taskId);

        try (PDDocument document = new PDDocument()) {
            float yPosition = 750;
            float margin = 50;
            float lineHeight = 20;
            float currentY = yPosition;
            PDPage page = new PDPage();
            document.addPage(page);
            PDPageContentStream contentStream = new PDPageContentStream(document, page);

            // Title
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 16);
            contentStream.newLineAtOffset(margin, currentY);
            contentStream.showText("Evaluation Task Participants Report");
            contentStream.endText();
            currentY -= 30;

            // Task Info
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
            contentStream.newLineAtOffset(margin, currentY);
            contentStream.showText("Task: " + task.getTitle());
            contentStream.endText();
            currentY -= 20;

            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(margin, currentY);
            contentStream.showText("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            contentStream.endText();
            currentY -= 30;

            // Headers
            float[] colXPositions = {margin, margin + 100, margin + 250, margin + 370, margin + 450, margin + 510, margin + 570};
            String[] headers = {"Participant", "Email", "Status", "Assigned", "Due Date", "Completed", "Progress"};

            contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
            for (int i = 0; i < headers.length; i++) {
                contentStream.beginText();
                contentStream.newLineAtOffset(colXPositions[i], currentY);
                contentStream.showText(headers[i]);
                contentStream.endText();
            }
            currentY -= 25;

            // Draw line
            contentStream.moveTo(margin, currentY);
            contentStream.lineTo(550, currentY);
            contentStream.stroke();
            currentY -= 15;

            // Data rows
            contentStream.setFont(PDType1Font.HELVETICA, 8);
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            for (ParticipantAssignmentDTO participant : participants) {
                if (currentY < 50) {
                    contentStream.close();
                    page = new PDPage();
                    document.addPage(page);
                    contentStream = new PDPageContentStream(document, page);
                    currentY = 750;
                }

                String participantName = participant.getParticipantName() != null && participant.getParticipantName().length() > 15
                    ? participant.getParticipantName().substring(0, 12) + "..."
                    : (participant.getParticipantName() != null ? participant.getParticipantName() : "");
                String email = participant.getParticipantEmail() != null && participant.getParticipantEmail().length() > 25
                    ? participant.getParticipantEmail().substring(0, 22) + "..."
                    : (participant.getParticipantEmail() != null ? participant.getParticipantEmail() : "");
                String status = participant.getStatus() != null ? participant.getStatus() : "";
                String assignedAt = participant.getAssignedAt() != null ? participant.getAssignedAt().format(dateFormatter) : "";
                String dueDate = participant.getDueDate() != null ? participant.getDueDate().format(dateFormatter) : "";
                String completedAt = participant.getCompletedAt() != null ? participant.getCompletedAt().format(dateFormatter) : "";
                String progress = (participant.getCompletedCount() != null && participant.getTotalCount() != null)
                    ? participant.getCompletedCount() + "/" + participant.getTotalCount()
                    : "N/A";

                String[] values = {participantName, email, status, assignedAt, dueDate, completedAt, progress};

                for (int i = 0; i < values.length; i++) {
                    contentStream.beginText();
                    contentStream.newLineAtOffset(colXPositions[i], currentY);
                    contentStream.showText(values[i]);
                    contentStream.endText();
                }
                currentY -= lineHeight;
            }

            contentStream.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Export task participants as Excel
     */
    @Transactional(readOnly = true)
    public byte[] exportTaskParticipantsAsExcel(Long taskId) throws IOException {
        EvaluationTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        List<ParticipantAssignmentDTO> participants = getTaskAssignments(taskId);
        User currentUser = userRepository.findById(task.getCreatedBy().getId())
                .orElseThrow(() -> new IllegalStateException("Task creator not found"));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Participants");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "ID", "Participant Name", "Email", "Username", "Status", "Assigned At", 
                "Due Date", "Completed At", "Progress"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (ParticipantAssignmentDTO participant : participants) {
                Row row = sheet.createRow(rowNum++);
                int colNum = 0;

                // ID
                row.createCell(colNum++).setCellValue(participant.getId() != null ? String.valueOf(participant.getId()) : "");
                
                // Participant Name
                row.createCell(colNum++).setCellValue(participant.getParticipantName() != null ? participant.getParticipantName() : "");
                
                // Email
                row.createCell(colNum++).setCellValue(participant.getParticipantEmail() != null ? participant.getParticipantEmail() : "");
                
                // Username
                row.createCell(colNum++).setCellValue(participant.getParticipantUsername() != null ? participant.getParticipantUsername() : "");
                
                // Status
                row.createCell(colNum++).setCellValue(participant.getStatus() != null ? participant.getStatus() : "");
                
                // Assigned At
                row.createCell(colNum++).setCellValue(
                    participant.getAssignedAt() != null ? participant.getAssignedAt().format(formatter) : ""
                );
                
                // Due Date
                row.createCell(colNum++).setCellValue(
                    participant.getDueDate() != null ? participant.getDueDate().format(formatter) : ""
                );
                
                // Completed At
                row.createCell(colNum++).setCellValue(
                    participant.getCompletedAt() != null ? participant.getCompletedAt().format(formatter) : ""
                );
                
                // Progress
                String progress = (participant.getCompletedCount() != null && participant.getTotalCount() != null)
                    ? participant.getCompletedCount() + "/" + participant.getTotalCount()
                    : "N/A";
                row.createCell(colNum++).setCellValue(progress);

                // Apply style to all cells
                for (int i = 0; i < headers.length; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                if (sheet.getColumnWidth(i) < 2000) {
                    sheet.setColumnWidth(i, 2000);
                }
            }

            // Add metadata sheet
            Sheet metadataSheet = workbook.createSheet("Metadata");
            Row metaRow1 = metadataSheet.createRow(0);
            metaRow1.createCell(0).setCellValue("Task Title:");
            metaRow1.createCell(1).setCellValue(task.getTitle());
            
            Row metaRow2 = metadataSheet.createRow(1);
            metaRow2.createCell(0).setCellValue("Generated by:");
            metaRow2.createCell(1).setCellValue(currentUser.getFullName());
            
            Row metaRow3 = metadataSheet.createRow(2);
            metaRow3.createCell(0).setCellValue("Generated on:");
            metaRow3.createCell(1).setCellValue(LocalDateTime.now().format(formatter));
            
            Row metaRow4 = metadataSheet.createRow(3);
            metaRow4.createCell(0).setCellValue("Total Participants:");
            metaRow4.createCell(1).setCellValue(participants.size());

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }
}
