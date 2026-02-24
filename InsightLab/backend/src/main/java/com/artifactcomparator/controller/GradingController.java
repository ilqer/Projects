package com.artifactcomparator.controller;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.service.GradingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/grading")
@RequiredArgsConstructor
public class GradingController {

    private final GradingService gradingService;

    /**
     * Auto-grade a submission (grades all objective questions)
     * POST /api/grading/submissions/{submissionId}/auto-grade
     */
    @PostMapping("/submissions/{submissionId}/auto-grade")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuizSubmissionDTO> autoGradeSubmission(@PathVariable Long submissionId) {
        QuizSubmissionDTO result = gradingService.autoGradeSubmission(submissionId);
        return ResponseEntity.ok(result);
    }

    /**
     * Manually grade a single answer
     * POST /api/grading/answers/manual-grade
     */
    @PostMapping("/answers/manual-grade")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuestionAnswerDTO> manuallyGradeAnswer(@Valid @RequestBody ManualGradeRequest request) {
        QuestionAnswerDTO result = gradingService.manuallyGradeAnswer(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Bulk grade multiple answers in a submission
     * POST /api/grading/submissions/bulk-grade
     */
    @PostMapping("/submissions/bulk-grade")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuizSubmissionDTO> bulkGradeSubmission(@Valid @RequestBody BulkGradeRequest request) {
        QuizSubmissionDTO result = gradingService.bulkGradeSubmission(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Finalize grading and return results to participant
     * POST /api/grading/submissions/{submissionId}/finalize
     */
    @PostMapping("/submissions/{submissionId}/finalize")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuizSubmissionDTO> finalizeGrading(
            @PathVariable Long submissionId,
            @Valid @RequestBody FinalizeGradingRequest request) {

        request.setSubmissionId(submissionId);
        QuizSubmissionDTO result = gradingService.finalizeGrading(request);
        return ResponseEntity.ok(result);
    }

    /**
     * Get all submissions for the current researcher
     * GET /api/grading/submissions
     */
    @GetMapping("/submissions")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<SubmissionSummaryDTO>> getSubmissions() {
        List<SubmissionSummaryDTO> submissions = gradingService.getSubmissionsForResearcher();
        return ResponseEntity.ok(submissions);
    }

    /**
     * Get submissions requiring manual grading
     * GET /api/grading/submissions/pending
     */
    @GetMapping("/submissions/pending")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<SubmissionSummaryDTO>> getPendingManualGrading() {
        List<SubmissionSummaryDTO> submissions = gradingService.getPendingManualGrading();
        return ResponseEntity.ok(submissions);
    }

    /**
     * Get detailed submission with all answers for grading
     * GET /api/grading/submissions/{submissionId}
     */
    @GetMapping("/submissions/{submissionId}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT')")
    public ResponseEntity<QuizSubmissionDTO> getSubmissionDetails(@PathVariable Long submissionId) {
        QuizSubmissionDTO submission = gradingService.getSubmissionDetails(submissionId);
        return ResponseEntity.ok(submission);
    }

    /**
     * Get grading history/audit log for a submission
     * GET /api/grading/submissions/{submissionId}/history
     */
    @GetMapping("/submissions/{submissionId}/history")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<GradingActionDTO>> getGradingHistory(@PathVariable Long submissionId) {
        List<GradingActionDTO> history = gradingService.getGradingHistory(submissionId);
        return ResponseEntity.ok(history);
    }

    /**
     * Export all grading actions as PDF
     * GET /api/grading/export/pdf
     */
    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<byte[]> exportGradingActionsAsPDF() {
        try {
            byte[] pdfBytes = gradingService.exportGradingActionsAsPDF();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            String filename = "grading_actions_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".pdf";
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Export all grading actions as Excel
     * GET /api/grading/export/excel
     */
    @GetMapping("/export/excel")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<byte[]> exportGradingActionsAsExcel() {
        try {
            byte[] excelBytes = gradingService.exportGradingActionsAsExcel();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            String filename = "grading_actions_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".xlsx";
            headers.setContentDispositionFormData("attachment", filename);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
