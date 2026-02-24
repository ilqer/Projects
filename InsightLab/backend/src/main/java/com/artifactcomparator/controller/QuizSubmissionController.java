package com.artifactcomparator.controller;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.service.QuizSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quiz-submissions")
@RequiredArgsConstructor
public class QuizSubmissionController {

    private final QuizSubmissionService quizSubmissionService;

    /**
     * Start a new quiz attempt
     * POST /api/quiz-submissions/start/{assignmentId}
     */
    @PostMapping("/start/{assignmentId}")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuizSubmissionDTO> startQuizAttempt(@PathVariable Long assignmentId) {
        QuizSubmissionDTO result = quizSubmissionService.startQuizAttempt(assignmentId);
        return ResponseEntity.ok(result);
    }

    /**
     * Get quiz questions for taking (without correct answers)
     * GET /api/quiz-submissions/{submissionId}/quiz
     */
    @GetMapping("/{submissionId}/quiz")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuizTakingDTO> getQuizForTaking(@PathVariable Long submissionId) {
        QuizTakingDTO quiz = quizSubmissionService.getQuizForTaking(submissionId);
        return ResponseEntity.ok(quiz);
    }

    /**
     * Submit an answer to a question
     * POST /api/quiz-submissions/answer
     */
    @PostMapping("/answer")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuestionAnswerDTO> submitAnswer(@Valid @RequestBody SubmitAnswerRequest request) {
        QuestionAnswerDTO result = quizSubmissionService.submitAnswer(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Submit the entire quiz
     * POST /api/quiz-submissions/{submissionId}/submit
     */
    @PostMapping("/{submissionId}/submit")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuizSubmissionDTO> submitQuiz(@PathVariable Long submissionId) {
        QuizSubmissionDTO result = quizSubmissionService.submitQuiz(submissionId);
        return ResponseEntity.ok(result);
    }

    /**
     * Get quiz results (for participant after grading)
     * GET /api/quiz-submissions/{submissionId}/result
     */
    @GetMapping("/{submissionId}/result")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuizSubmissionDTO> getSubmissionResult(@PathVariable Long submissionId) {
        QuizSubmissionDTO result = quizSubmissionService.getSubmissionResult(submissionId);
        return ResponseEntity.ok(result);
    }

    /**
     * Exception handler for IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Exception handler for IllegalStateException
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex) {
        ErrorResponse error = new ErrorResponse(ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
}
