package com.artifactcomparator.service;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.model.*;
import com.artifactcomparator.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizSubmissionService {

    private final QuizSubmissionRepository submissionRepository;
    private final QuizAssignmentRepository assignmentRepository;
    private final QuestionAnswerRepository answerRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final UserRepository userRepository;
    private final GradingService gradingService;
    private final NotificationService notificationService;

    /**
     * Start a new quiz attempt
     */
    public QuizSubmissionDTO startQuizAttempt(Long assignmentId) {
        try {
            return startQuizAttemptInternal(assignmentId);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle race condition: submission was created by concurrent request
            log.warn("Duplicate submission detected for assignment {}, fetching existing submission", assignmentId);
            return getExistingSubmission(assignmentId);
        }
    }

    @Transactional
    private QuizSubmissionDTO startQuizAttemptInternal(Long assignmentId) {
        User participant = getCurrentUser();

        QuizAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz assignment not found"));

        // Validate participant
        if (!assignment.getParticipant().getId().equals(participant.getId())) {
            throw new IllegalStateException("You can only start your own quiz assignments");
        }

        // Auto-accept pending assignments when participant starts the quiz
        if (assignment.getStatus() == QuizAssignment.AssignmentStatus.PENDING) {
            assignment.accept();
            assignmentRepository.save(assignment);
        }

        // Check if assignment is in a valid state to start
        if (assignment.getStatus() != QuizAssignment.AssignmentStatus.ACCEPTED &&
            assignment.getStatus() != QuizAssignment.AssignmentStatus.IN_PROGRESS) {
            throw new IllegalStateException("Quiz assignment must be accepted before starting");
        }

        // Check if retake is allowed
        if (assignment.getStatus() == QuizAssignment.AssignmentStatus.COMPLETED && !assignment.canRetake()) {
            throw new IllegalStateException("No retakes allowed for this quiz");
        }

        // Check if already has an in-progress submission
        QuizSubmission existingSubmission = submissionRepository
                .findByQuizAssignmentIdAndAttemptNumber(assignmentId, assignment.getAttemptsTaken() + 1)
                .orElse(null);

        if (existingSubmission != null && existingSubmission.getStatus() == QuizSubmission.SubmissionStatus.IN_PROGRESS) {
            log.info("Returning existing in-progress submission {} for assignment {}", existingSubmission.getId(), assignmentId);
            return convertToDTO(existingSubmission);
        }

        // Create new submission
        int attemptNumber = assignment.getAttemptsTaken() + 1;

        QuizSubmission submission = QuizSubmission.builder()
                .quizAssignment(assignment)
                .participant(participant)
                .questionnaire(assignment.getQuestionnaire())
                .attemptNumber(attemptNumber)
                .status(QuizSubmission.SubmissionStatus.IN_PROGRESS)
                .totalPointsPossible(assignment.getQuestionnaire().getTotalPoints())
                .requiresManualGrading(false)
                .build();

        submission = submissionRepository.save(submission);

        // Update assignment status
        assignment.startQuiz();
        assignmentRepository.save(assignment);

        log.info("Started quiz attempt {} for assignment {} by user {}",
                attemptNumber, assignmentId, participant.getUsername());

        return convertToDTO(submission);
    }

    @Transactional(readOnly = true)
    private QuizSubmissionDTO getExistingSubmission(Long assignmentId) {
        QuizAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz assignment not found"));

        int attemptNumber = assignment.getAttemptsTaken() + 1;

        QuizSubmission existingSubmission = submissionRepository
                .findByQuizAssignmentIdAndAttemptNumber(assignmentId, attemptNumber)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve submission after race condition"));

        log.info("Returning existing submission {} for assignment {} after handling race condition",
                existingSubmission.getId(), assignmentId);

        return convertToDTO(existingSubmission);
    }

    /**
     * Get quiz questions for taking the quiz (without answers)
     */
    @Transactional(readOnly = true)
    public QuizTakingDTO getQuizForTaking(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User currentUser = getCurrentUser();

        if (!submission.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only view your own quiz submissions");
        }

        if (submission.getStatus() != QuizSubmission.SubmissionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Quiz is not in progress");
        }

        Questionnaire questionnaire = submission.getQuestionnaire();

        // Convert questions to DTOs (without correct answers)
        List<QuizQuestionDTO> questions = questionnaire.getQuestions().stream()
                .sorted((q1, q2) -> q1.getDisplayOrder().compareTo(q2.getDisplayOrder()))
                .map(this::convertQuestionForTaking)
                .collect(Collectors.toList());

        List<QuestionAnswerDTO> savedAnswers = answerRepository
                .findBySubmissionIdOrderByQuestionIdAsc(submission.getId())
                .stream()
                .map(this::convertAnswerForTaking)
                .collect(Collectors.toList());

        return QuizTakingDTO.builder()
                .submissionId(submission.getId())
                .questionnaireId(questionnaire.getId())
                .questionnaireTitle(questionnaire.getTitle())
                .questionnaireDescription(questionnaire.getDescription())
                .timeLimitMinutes(questionnaire.getTimeLimitMinutes())
                .totalPoints(questionnaire.getTotalPoints())
                .passingThreshold(questionnaire.getPassingThreshold())
                .allowReview(questionnaire.getAllowReview())
                .startedAt(submission.getStartedAt())
                .questions(questions)
                .answers(savedAnswers)
                .build();
    }

    /**
     * Submit answer to a question
     */
    @Transactional
    public QuestionAnswerDTO submitAnswer(SubmitAnswerRequest request) {
        QuizSubmission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User currentUser = getCurrentUser();

        if (!submission.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only submit answers to your own quiz");
        }

        if (submission.getStatus() != QuizSubmission.SubmissionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Cannot submit answers to a quiz that is not in progress");
        }

        Question question = submission.getQuestionnaire().getQuestions().stream()
                .filter(q -> q.getId().equals(request.getQuestionId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question not found in this quiz"));

        // Check if answer already exists
        QuestionAnswer answer = answerRepository.findBySubmissionIdAndQuestionId(
                submission.getId(), question.getId()
        ).orElse(null);

        if (answer == null) {
            // Create new answer
            answer = QuestionAnswer.builder()
                    .submission(submission)
                    .question(question)
                    .pointsPossible(question.getPoints())
                    .build();
        }

        // Update answer based on question type
        if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE) {
            answer.setSelectedOptionIdList(request.getSelectedOptionIds());
            answer.setRequiresManualGrading(false);
        } else if (question.getType() == Question.QuestionType.TRUE_FALSE) {
            answer.setAnswerText(request.getAnswerText());
            answer.setRequiresManualGrading(false);
        } else if (question.getType() == Question.QuestionType.SHORT_ANSWER) {
            answer.setAnswerText(request.getAnswerText());
            answer.setRequiresManualGrading(true);
        }

        answer = answerRepository.save(answer);

        log.info("Saved answer for question {} in submission {}", question.getId(), submission.getId());

        // Don't include correct answers in response during quiz taking
        return convertAnswerForTaking(answer);
    }

    /**
     * Submit the entire quiz
     */
    @Transactional
    public QuizSubmissionDTO submitQuiz(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User currentUser = getCurrentUser();

        if (!submission.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only submit your own quiz");
        }

        if (submission.getStatus() != QuizSubmission.SubmissionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Quiz is not in progress");
        }

        // Submit the quiz
        submission.submit();
        submission = submissionRepository.save(submission);

        log.info("Quiz submission {} submitted by user {}", submissionId, currentUser.getUsername());

        // Automatically trigger auto-grading (use performAutoGrading to bypass permission checks)
        try {
            QuizSubmissionDTO graded = gradingService.performAutoGrading(submission, currentUser);

            // Notify researcher about new submission
            notificationService.createNotification(
                    submission.getQuestionnaire().getResearcher(),
                    currentUser,
                    Notification.NotificationType.SYSTEM_ALERT,
                    "New Quiz Submission",
                    currentUser.getFullName() + " has submitted \"" +
                            submission.getQuestionnaire().getTitle() + "\"" +
                            (graded.getRequiresManualGrading() ? " (requires manual grading)" : ""),
                    Notification.RelatedEntityType.QUIZ_ASSIGNMENT,
                    submission.getQuizAssignment().getId()
            );

            return graded;
        } catch (Exception e) {
            log.error("Error auto-grading submission {}", submissionId, e);
            // Return submission even if auto-grading fails
            return convertToDTO(submission);
        }
    }

    /**
     * Get submission result (for participant after grading)
     */
    @Transactional(readOnly = true)
    public QuizSubmissionDTO getSubmissionResult(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User currentUser = getCurrentUser();

        if (!submission.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only view your own quiz results");
        }

        if (submission.getStatus() != QuizSubmission.SubmissionStatus.RETURNED &&
            submission.getStatus() != QuizSubmission.SubmissionStatus.GRADED) {
            throw new IllegalStateException("Results are not yet available");
        }

        return convertToDTO(submission);
    }

    // Helper methods

    private QuizQuestionDTO convertQuestionForTaking(Question question) {
        List<QuizQuestionOptionDTO> options = question.getOptions().stream()
                .sorted((o1, o2) -> o1.getDisplayOrder().compareTo(o2.getDisplayOrder()))
                .map(option -> QuizQuestionOptionDTO.builder()
                        .id(option.getId())
                        .optionText(option.getOptionText())
                        .displayOrder(option.getDisplayOrder())
                        // Don't include isCorrect during quiz taking
                        .build())
                .collect(Collectors.toList());

        return QuizQuestionDTO.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .type(question.getType().name())
                .points(question.getPoints())
                .displayOrder(question.getDisplayOrder())
                .options(options)
                .build();
    }

    private QuestionAnswerDTO convertAnswerForTaking(QuestionAnswer answer) {
        return QuestionAnswerDTO.builder()
                .id(answer.getId())
                .submissionId(answer.getSubmission().getId())
                .questionId(answer.getQuestion().getId())
                .answerText(answer.getAnswerText())
                .selectedOptionIds(answer.getSelectedOptionIdList())
                .pointsPossible(answer.getPointsPossible())
                .answeredAt(answer.getAnsweredAt())
                // Don't include correct answers, grading info, or feedback during taking
                .build();
    }

    private QuizSubmissionDTO convertToDTO(QuizSubmission submission) {
        return QuizSubmissionDTO.builder()
                .id(submission.getId())
                .quizAssignmentId(submission.getQuizAssignment().getId())
                .participantId(submission.getParticipant().getId())
                .participantName(submission.getParticipant().getFullName())
                .participantEmail(submission.getParticipant().getEmail())
                .questionnaireId(submission.getQuestionnaire().getId())
                .questionnaireTitle(submission.getQuestionnaire().getTitle())
                .attemptNumber(submission.getAttemptNumber())
                .status(submission.getStatus())
                .startedAt(submission.getStartedAt())
                .submittedAt(submission.getSubmittedAt())
                .gradedAt(submission.getGradedAt())
                .autoScore(submission.getAutoScore())
                .manualScore(submission.getManualScore())
                .finalScore(submission.getFinalScore())
                .totalPointsEarned(submission.getTotalPointsEarned())
                .totalPointsPossible(submission.getTotalPointsPossible())
                .passed(submission.getPassed())
                .requiresManualGrading(submission.getRequiresManualGrading())
                .timeTakenMinutes(submission.getTimeTakenMinutes())
                .timeLimitMinutes(submission.getQuestionnaire().getTimeLimitMinutes())
                .overTime(submission.isOverTime())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
}
