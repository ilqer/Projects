package com.artifactcomparator.service;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.model.*;
import com.artifactcomparator.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionnaireService {
    
    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final QuestionVersionRepository questionVersionRepository;
    private final UserRepository userRepository;
    private final StudyQuizRepository studyQuizRepository;
    private final ObjectMapper objectMapper;
    
    @Transactional
    public QuestionnaireResponseDTO createQuestionnaire(QuestionnaireCreateDTO dto) {
        User researcher = getCurrentUser();

        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can create questionnaires");
        }

        // Validate scoring configuration and questions before creating
        validateScoringConfiguration(dto.getType(), dto.getPassingThreshold());
        validateQuestions(dto.getQuestions());

        Questionnaire questionnaire = Questionnaire.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .researcher(researcher)
                // UC4-2: Set scoring configuration
                .passingThreshold(dto.getPassingThreshold())
                .intermediateThreshold(dto.getIntermediateThreshold())
                .advancedThreshold(dto.getAdvancedThreshold())
                .timeLimitMinutes(dto.getTimeLimitMinutes())
                .showCorrectAnswers(dto.getShowCorrectAnswers())
                .randomizeQuestions(dto.getRandomizeQuestions())
                .randomizeOptions(dto.getRandomizeOptions())
                .allowReview(dto.getAllowReview())
                .gradingMethod(dto.getGradingMethod())
                .version(1)
                .isActive(true)
                .build();

        // Add questions
        for (int i = 0; i < dto.getQuestions().size(); i++) {
            QuestionCreateDTO questionDTO = dto.getQuestions().get(i);
            Question question = createQuestionFromDTO(questionDTO, questionnaire, i);
            questionnaire.addQuestion(question);
        }

        // Calculate total points
        questionnaire.calculateTotalPoints();

        Questionnaire saved = questionnaireRepository.save(questionnaire);

        // Create initial version history for all questions
        saved.getQuestions().forEach(this::createQuestionVersion);

        return convertToResponseDTO(saved);
    }
    

    
    @Transactional
    public QuestionnaireResponseDTO updateQuestionnaire(Long questionnaireId, QuestionnaireUpdateDTO dto) {
        Questionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
    
        User currentUser = getCurrentUser();
    
        if (!questionnaire.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only update your own questionnaires");
        }
    
        // Validate scoring configuration
        validateScoringConfiguration(dto.getType(), dto.getPassingThreshold());

        // Update basic info
        questionnaire.setTitle(dto.getTitle());
        questionnaire.setDescription(dto.getDescription());
        questionnaire.setType(dto.getType());
    
        // UC4-2: Update scoring configuration
        questionnaire.setPassingThreshold(dto.getPassingThreshold());
        questionnaire.setIntermediateThreshold(dto.getIntermediateThreshold());
        questionnaire.setAdvancedThreshold(dto.getAdvancedThreshold());
        questionnaire.setTimeLimitMinutes(dto.getTimeLimitMinutes());
        questionnaire.setShowCorrectAnswers(dto.getShowCorrectAnswers());
        questionnaire.setRandomizeQuestions(dto.getRandomizeQuestions());
        questionnaire.setRandomizeOptions(dto.getRandomizeOptions());
        questionnaire.setAllowReview(dto.getAllowReview());
        questionnaire.setGradingMethod(dto.getGradingMethod());
    
        // Handle questions update
        if (dto.getQuestions() != null) {
            // Remove old questions
            questionnaire.getQuestions().clear();
    
            // Add new/updated questions
            for (int i = 0; i < dto.getQuestions().size(); i++) {
                QuestionCreateDTO questionDTO = dto.getQuestions().get(i);
                Question question = createQuestionFromDTO(questionDTO, questionnaire, i);
                questionnaire.addQuestion(question);
            }
    
            // Increment version
            questionnaire.setVersion(questionnaire.getVersion() + 1);
        }
    
        // Recalculate total points
        questionnaire.calculateTotalPoints();
    
        Questionnaire updated = questionnaireRepository.save(questionnaire);
    
        // Create version history for updated questions
        updated.getQuestions().forEach(this::createQuestionVersion);
    
        return convertToResponseDTO(updated);
    }
    
    
    @Transactional
    public QuestionnaireResponseDTO importQuestionnaire(QuestionnaireImportDTO importDTO) {
        User researcher = getCurrentUser();
        
        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can import questionnaires");
        }
        
        // Validate the import data and scoring configuration
        validateImportData(importDTO);
        validateScoringConfiguration(importDTO.getType(), importDTO.getPassingThreshold());
        
        Questionnaire questionnaire = Questionnaire.builder()
                .title(importDTO.getTitle())
                .description(importDTO.getDescription())
                .type(importDTO.getType())
                .researcher(researcher)
                .version(1)
                .isActive(true)
                .build();

        questionnaire.setPassingThreshold(importDTO.getPassingThreshold());
        questionnaire.setIntermediateThreshold(importDTO.getIntermediateThreshold());
        questionnaire.setAdvancedThreshold(importDTO.getAdvancedThreshold());
        questionnaire.setTimeLimitMinutes(importDTO.getTimeLimitMinutes());
        questionnaire.setShowCorrectAnswers(
                importDTO.getShowCorrectAnswers() != null ? importDTO.getShowCorrectAnswers() : Boolean.TRUE);
        questionnaire.setRandomizeQuestions(
                importDTO.getRandomizeQuestions() != null ? importDTO.getRandomizeQuestions() : Boolean.FALSE);
        questionnaire.setRandomizeOptions(
                importDTO.getRandomizeOptions() != null ? importDTO.getRandomizeOptions() : Boolean.FALSE);
        questionnaire.setAllowReview(importDTO.getAllowReview() != null ? importDTO.getAllowReview() : Boolean.TRUE);
        questionnaire.setGradingMethod(
                importDTO.getGradingMethod() != null
                        ? importDTO.getGradingMethod()
                        : Questionnaire.GradingMethod.AUTOMATIC);
        
        // Import questions
        for (int i = 0; i < importDTO.getQuestions().size(); i++) {
            QuestionImportDTO questionDTO = importDTO.getQuestions().get(i);
            Question question = createQuestionFromImportDTO(questionDTO, questionnaire, i);
            questionnaire.addQuestion(question);
        }
        
        Questionnaire saved = questionnaireRepository.save(questionnaire);
        
        // Create version history
        saved.getQuestions().forEach(this::createQuestionVersion);
        
        return convertToResponseDTO(saved);
    }
    
    @Transactional(readOnly = true)
    public QuestionnaireResponseDTO getQuestionnaireById(Long id) {
        Questionnaire questionnaire = questionnaireRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
        
        return convertToResponseDTO(questionnaire);
    }
    
    @Transactional(readOnly = true)
    public List<QuestionnaireListDTO> getMyQuestionnaires() {
        User researcher = getCurrentUser();
        return questionnaireRepository.findByResearcherIdOrderByCreatedAtDesc(researcher.getId())
                .stream()
                .map(this::convertToListDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<QuestionnaireListDTO> getActiveQuestionnaires() {
        User researcher = getCurrentUser();
        return questionnaireRepository.findByResearcherIdAndIsActiveTrueOrderByCreatedAtDesc(researcher.getId())
                .stream()
                .map(this::convertToListDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteQuestionnaire(Long id) {
        Questionnaire questionnaire = questionnaireRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
        
        User currentUser = getCurrentUser();
        
        if (!questionnaire.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only delete your own questionnaires");
        }
        
        questionnaireRepository.delete(questionnaire);
    }
    
    @Transactional
    public QuestionnaireResponseDTO deactivateQuestionnaire(Long id) {
        Questionnaire questionnaire = questionnaireRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
        
        User currentUser = getCurrentUser();
        
        if (!questionnaire.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only deactivate your own questionnaires");
        }
        
        questionnaire.setIsActive(false);
        Questionnaire updated = questionnaireRepository.save(questionnaire);
        
        return convertToResponseDTO(updated);
    }
    
    @Transactional
    public QuestionnaireResponseDTO activateQuestionnaire(Long id) {
        Questionnaire questionnaire = questionnaireRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));
        
        User currentUser = getCurrentUser();
        
        if (!questionnaire.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only activate your own questionnaires");
        }
        
        questionnaire.setIsActive(true);
        Questionnaire updated = questionnaireRepository.save(questionnaire);
        
        return convertToResponseDTO(updated);
    }
    
    // Helper methods
    
    private Question createQuestionFromDTO(QuestionCreateDTO dto, Questionnaire questionnaire, int order) {
        Question question = Question.builder()
                .questionText(dto.getQuestionText())
                .type(dto.getType())
                .correctAnswer(dto.getCorrectAnswer())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : order)
                .points(dto.getPoints() != null ? dto.getPoints() : 1)
                .version(1)
                .isActive(true)
                .build();

        // Add options for MCQ and True/False
        if (dto.getOptions() != null && !dto.getOptions().isEmpty()) {
            for (int i = 0; i < dto.getOptions().size(); i++) {
                QuestionOptionDTO optionDTO = dto.getOptions().get(i);
                QuestionOption option = QuestionOption.builder()
                        .optionText(optionDTO.getOptionText())
                        .isCorrect(optionDTO.getIsCorrect() != null ? optionDTO.getIsCorrect() : false)
                        .displayOrder(optionDTO.getDisplayOrder() != null ? optionDTO.getDisplayOrder() : i)
                        .build();
                question.addOption(option);

                // For TRUE_FALSE questions, set correctAnswer from the option marked as correct
                if (dto.getType() == Question.QuestionType.TRUE_FALSE && option.getIsCorrect()) {
                    question.setCorrectAnswer(option.getOptionText().toLowerCase());
                }
            }
        }

        return question;
    }
    
    private Question createQuestionFromImportDTO(QuestionImportDTO dto, Questionnaire questionnaire, int order) {
        Question question = Question.builder()
                .questionText(dto.getQuestionText())
                .type(dto.getType())
                .correctAnswer(dto.getCorrectAnswer())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : order)
                .points(dto.getPoints() != null ? dto.getPoints() : 1)
                .version(1)
                .isActive(true)
                .build();

        // Add options
        if (dto.getOptions() != null && !dto.getOptions().isEmpty()) {
            for (int i = 0; i < dto.getOptions().size(); i++) {
                QuestionOptionImportDTO optionDTO = dto.getOptions().get(i);
                QuestionOption option = QuestionOption.builder()
                        .optionText(optionDTO.getOptionText())
                        .isCorrect(optionDTO.getIsCorrect() != null ? optionDTO.getIsCorrect() : false)
                        .displayOrder(optionDTO.getDisplayOrder() != null ? optionDTO.getDisplayOrder() : i)
                        .build();
                question.addOption(option);

                // For TRUE_FALSE questions, set correctAnswer from the option marked as correct
                if (dto.getType() == Question.QuestionType.TRUE_FALSE && option.getIsCorrect()) {
                    question.setCorrectAnswer(option.getOptionText().toLowerCase());
                }
            }
        }

        return question;
    }
    
    private void createQuestionVersion(Question question) {
        String optionsJson = null;
        if (!question.getOptions().isEmpty()) {
            try {
                optionsJson = objectMapper.writeValueAsString(
                        question.getOptions().stream()
                                .map(opt -> new QuestionOptionDTO(
                                        opt.getId(),
                                        opt.getOptionText(),
                                        opt.getIsCorrect(),
                                        opt.getDisplayOrder()
                                ))
                                .collect(Collectors.toList())
                );
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to serialize options", e);
            }
        }
        
        QuestionVersion version = QuestionVersion.builder()
                .questionId(question.getId())
                .version(question.getVersion())
                .questionText(question.getQuestionText())
                .type(question.getType())
                .correctAnswer(question.getCorrectAnswer())
                .optionsJson(optionsJson)
                .points(question.getPoints())
                .createdBy(getCurrentUser().getId())
                .build();
        
        questionVersionRepository.save(version);
    }

    private void validateQuestions(List<QuestionCreateDTO> questions) {
        for (int i = 0; i < questions.size(); i++) {
            QuestionCreateDTO question = questions.get(i);
            String questionLabel = "Question " + (i + 1);

            // Validate MCQ has options and at least one correct option
            if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE) {
                if (question.getOptions() == null || question.getOptions().isEmpty()) {
                    throw new IllegalArgumentException(questionLabel + ": Multiple choice questions must have options");
                }

                long correctCount = question.getOptions().stream()
                        .filter(opt -> opt.getIsCorrect() != null && opt.getIsCorrect())
                        .count();

                if (correctCount == 0) {
                    throw new IllegalArgumentException(questionLabel + ": Multiple choice questions must have at least one correct option");
                }
            }

            // Validate True/False has exactly 2 options and at least one correct
            if (question.getType() == Question.QuestionType.TRUE_FALSE) {
                if (question.getOptions() == null || question.getOptions().size() != 2) {
                    throw new IllegalArgumentException(questionLabel + ": True/False questions must have exactly 2 options");
                }

                long correctCount = question.getOptions().stream()
                        .filter(opt -> opt.getIsCorrect() != null && opt.getIsCorrect())
                        .count();

                if (correctCount != 1) {
                    throw new IllegalArgumentException(questionLabel + ": True/False questions must have exactly one correct option");
                }
            }

            // Validate Short Answer has correct answer
            if (question.getType() == Question.QuestionType.SHORT_ANSWER) {
                if (question.getCorrectAnswer() == null || question.getCorrectAnswer().trim().isEmpty()) {
                    throw new IllegalArgumentException(questionLabel + ": Short answer questions must have a correct answer");
                }
            }
        }
    }

    private void validateImportData(QuestionnaireImportDTO importDTO) {
        // Validate each question
        for (QuestionImportDTO question : importDTO.getQuestions()) {
            // Validate MCQ has options
            if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE) {
                if (question.getOptions() == null || question.getOptions().isEmpty()) {
                    throw new IllegalArgumentException("Multiple choice questions must have options");
                }
                
                long correctCount = question.getOptions().stream()
                        .filter(opt -> opt.getIsCorrect() != null && opt.getIsCorrect())
                        .count();
                
                if (correctCount == 0) {
                    throw new IllegalArgumentException("Multiple choice questions must have at least one correct option");
                }
            }
            
            // Validate True/False has exactly 2 options
            if (question.getType() == Question.QuestionType.TRUE_FALSE) {
                if (question.getOptions() == null || question.getOptions().size() != 2) {
                    throw new IllegalArgumentException("True/False questions must have exactly 2 options");
                }
            }
            
            // Validate Short Answer has correct answer
            if (question.getType() == Question.QuestionType.SHORT_ANSWER) {
                if (question.getCorrectAnswer() == null || question.getCorrectAnswer().trim().isEmpty()) {
                    throw new IllegalArgumentException("Short answer questions must have a correct answer");
                }
            }
        }
    }

    private void validateScoringConfiguration(Questionnaire.QuestionnaireType type, Double passingThreshold) {
        if (type == Questionnaire.QuestionnaireType.COMPETENCY) {
            if (passingThreshold == null) {
                throw new IllegalArgumentException("Passing threshold is required for competency quizzes");
            }
            if (passingThreshold < 1 || passingThreshold > 100) {
                throw new IllegalArgumentException("Passing threshold must be between 1 and 100");
            }
        }
        // BACKGROUND quizzes don't require passing threshold
    }
    
    private QuestionnaireResponseDTO convertToResponseDTO(Questionnaire questionnaire) {
        QuestionnaireResponseDTO dto = new QuestionnaireResponseDTO();
        dto.setId(questionnaire.getId());
        dto.setTitle(questionnaire.getTitle());
        dto.setDescription(questionnaire.getDescription());
        dto.setType(questionnaire.getType());
        dto.setVersion(questionnaire.getVersion());
        dto.setIsActive(questionnaire.getIsActive());
        dto.setResearcherId(questionnaire.getResearcher().getId());
        dto.setResearcherName(questionnaire.getResearcher().getFullName());
        dto.setQuestionCount(questionnaire.getQuestions().size());
        dto.setCreatedAt(questionnaire.getCreatedAt());
        dto.setUpdatedAt(questionnaire.getUpdatedAt());
    
        // Convert questions
        List<QuestionResponseDTO> questions = questionnaire.getQuestions().stream()
                .map(this::convertQuestionToDTO)
                .collect(Collectors.toList());
        dto.setQuestions(questions);
    
        // UC4-2: Set scoring configuration
        dto.setPassingThreshold(questionnaire.getPassingThreshold());
        dto.setIntermediateThreshold(questionnaire.getIntermediateThreshold());
        dto.setAdvancedThreshold(questionnaire.getAdvancedThreshold());
        dto.setTimeLimitMinutes(questionnaire.getTimeLimitMinutes());
        dto.setTotalPoints(questionnaire.getTotalPoints());
        dto.setShowCorrectAnswers(questionnaire.getShowCorrectAnswers());
        dto.setRandomizeQuestions(questionnaire.getRandomizeQuestions());
        dto.setRandomizeOptions(questionnaire.getRandomizeOptions());
        dto.setAllowReview(questionnaire.getAllowReview());
        dto.setGradingMethod(questionnaire.getGradingMethod());

        List<QuestionnaireStudyDTO> linkedStudies = studyQuizRepository.findByQuestionnaireId(questionnaire.getId())
                .stream()
                .map(studyQuiz -> QuestionnaireStudyDTO.builder()
                        .studyQuizId(studyQuiz.getId())
                        .studyId(studyQuiz.getStudy().getId())
                        .studyTitle(studyQuiz.getStudy().getTitle())
                        .studyStatus(studyQuiz.getStudy().getStatus().name())
                        .build())
                .collect(Collectors.toList());
        dto.setLinkedStudies(linkedStudies);
    
        return dto;
    }
    
    
    private QuestionnaireListDTO convertToListDTO(Questionnaire questionnaire) {
        QuestionnaireListDTO dto = new QuestionnaireListDTO();
        dto.setId(questionnaire.getId());
        dto.setTitle(questionnaire.getTitle());
        dto.setDescription(questionnaire.getDescription());
        dto.setType(questionnaire.getType());
        dto.setVersion(questionnaire.getVersion());
        dto.setIsActive(questionnaire.getIsActive());
        dto.setQuestionCount(questionnaire.getQuestions().size());
        dto.setCreatedAt(questionnaire.getCreatedAt());
        dto.setUpdatedAt(questionnaire.getUpdatedAt());
        
        return dto;
    }
    
    private QuestionResponseDTO convertQuestionToDTO(Question question) {
        QuestionResponseDTO dto = new QuestionResponseDTO();
        dto.setId(question.getId());
        dto.setQuestionText(question.getQuestionText());
        dto.setType(question.getType());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setDisplayOrder(question.getDisplayOrder());
        dto.setPoints(question.getPoints());
        dto.setVersion(question.getVersion());
        dto.setIsActive(question.getIsActive());
        dto.setCreatedAt(question.getCreatedAt());
        dto.setUpdatedAt(question.getUpdatedAt());
        
        // Convert options
        List<QuestionOptionDTO> options = question.getOptions().stream()
                .map(opt -> new QuestionOptionDTO(
                        opt.getId(),
                        opt.getOptionText(),
                        opt.getIsCorrect(),
                        opt.getDisplayOrder()
                ))
                .collect(Collectors.toList());
        dto.setOptions(options);
        
        return dto;
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
}
