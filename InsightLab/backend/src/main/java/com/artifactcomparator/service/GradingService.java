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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
@RequiredArgsConstructor
@Slf4j
public class GradingService {

    private final QuizSubmissionRepository submissionRepository;
    private final QuestionAnswerRepository answerRepository;
    private final GradingActionRepository gradingActionRepository;
    private final GradingFeedbackRepository feedbackRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final UserRepository userRepository;
    private final QuizAssignmentRepository quizAssignmentRepository;
    private final NotificationService notificationService;

    /**
     * Auto-grade objective questions (Multiple Choice, True/False)
     * This method is for researchers to manually trigger auto-grading
     */
    @Transactional
    public QuizSubmissionDTO autoGradeSubmission(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User grader = getCurrentUser();

        if (!canGradeSubmission(submission, grader)) {
            throw new IllegalStateException("You don't have permission to grade this submission");
        }

        log.info("Auto-grading submission {} by user {}", submissionId, grader.getUsername());

        return performAutoGrading(submission, grader);
    }

    /**
     * Internal method to perform auto-grading
     * Can be called without researcher permission checks (used during quiz submission)
     */
    @Transactional
    public QuizSubmissionDTO performAutoGrading(QuizSubmission submission, User grader) {
        int totalPoints = 0;
        int earnedPoints = 0;
        boolean requiresManualGrading = false;

        // Grade each answer
        for (QuestionAnswer answer : submission.getAnswers()) {
            Question question = answer.getQuestion();
            totalPoints += question.getPoints();

            if (question.getType() == Question.QuestionType.SHORT_ANSWER) {
                // Short answer requires manual grading
                answer.setRequiresManualGrading(true);
                answer.setPointsEarned(0.0);
                requiresManualGrading = true;
            } else {
                // Auto-grade objective questions
                boolean isCorrect = gradeObjectiveQuestion(answer, question);
                answer.setIsCorrect(isCorrect);
                answer.setPointsEarned(isCorrect ? question.getPoints().doubleValue() : 0.0);
                answer.setRequiresManualGrading(false);

                if (isCorrect) {
                    earnedPoints += question.getPoints();
                }
            }

            answerRepository.save(answer);

            // Log grading action
            GradingAction action = GradingAction.builder()
                    .submission(submission)
                    .questionAnswer(answer)
                    .grader(grader)
                    .actionType(GradingAction.ActionType.AUTO_GRADE)
                    .pointsBefore(0.0)
                    .pointsAfter(answer.getPointsEarned())
                    .build();
            gradingActionRepository.save(action);
        }

        // Update submission scores
        submission.setTotalPointsEarned(earnedPoints);
        submission.setTotalPointsPossible(totalPoints);
        submission.setRequiresManualGrading(requiresManualGrading);

        if (totalPoints > 0) {
            double percentage = (earnedPoints * 100.0) / totalPoints;
            submission.setAutoScore(percentage);

            if (!requiresManualGrading) {
                submission.setFinalScore(percentage);
                submission.calculateFinalScore();
            }
        }

        if (!requiresManualGrading) {
            submission.markAsGraded();
            QuizAssignment assignment = submission.getQuizAssignment();
            assignment.complete(submission.getFinalScore(), submission.getPassed());
            
            // Set level AFTER complete() call
            ParticipantLevel level = determineLevel(submission.getFinalScore(), submission.getQuestionnaire(), submission.getPassed());
            assignment.setLevel(level);
            
            // Save assignment to persist level
            quizAssignmentRepository.save(assignment);
        }

        submissionRepository.save(submission);

        log.info("Auto-grading completed for submission {}. Score: {}/{}",
                submission.getId(), earnedPoints, totalPoints);

        return convertToDTO(submission);
    }

    /**
     * Grade objective questions (MCQ, True/False)
     */
    private boolean gradeObjectiveQuestion(QuestionAnswer answer, Question question) {
        if (question.getType() == Question.QuestionType.MULTIPLE_CHOICE) {
            List<Long> selectedIds = answer.getSelectedOptionIdList();
            if (selectedIds.isEmpty()) {
                return false;
            }

            // Get correct options
            List<Long> correctOptionIds = question.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .map(QuestionOption::getId)
                    .collect(Collectors.toList());

            // Check if selected options match correct options
            return selectedIds.size() == correctOptionIds.size() &&
                    selectedIds.containsAll(correctOptionIds) &&
                    correctOptionIds.containsAll(selectedIds);

        } else if (question.getType() == Question.QuestionType.TRUE_FALSE) {
            if (answer.getAnswerText() == null) {
                return false;
            }
            String userAnswer = answer.getAnswerText().trim().toLowerCase();

            // First try to use correctAnswer field if populated
            if (question.getCorrectAnswer() != null && !question.getCorrectAnswer().trim().isEmpty()) {
                String correctAnswer = question.getCorrectAnswer().trim().toLowerCase();
                return userAnswer.equals(correctAnswer);
            }

            // Fall back to checking options (for backwards compatibility with old questions)
            return question.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .anyMatch(opt -> opt.getOptionText().trim().equalsIgnoreCase(userAnswer));
        }

        return false;
    }

    /**
     * Manually grade a single question answer
     */
    @Transactional
    public QuestionAnswerDTO manuallyGradeAnswer(ManualGradeRequest request) {
        QuestionAnswer answer = answerRepository.findById(request.getQuestionAnswerId())
                .orElseThrow(() -> new IllegalArgumentException("Question answer not found"));

        User grader = getCurrentUser();
        QuizSubmission submission = answer.getSubmission();

        if (!canGradeSubmission(submission, grader)) {
            throw new IllegalStateException("You don't have permission to grade this submission");
        }

        // Validate points
        if (request.getPointsEarned() > answer.getPointsPossible()) {
            throw new IllegalArgumentException("Points earned cannot exceed points possible");
        }

        log.info("Manually grading answer {} by user {}", answer.getId(), grader.getUsername());

        Double previousPoints = answer.getPointsEarned();
        answer.setPointsEarned(request.getPointsEarned());
        answer.setIsCorrect(request.getPointsEarned() > 0);
        answer.setRequiresManualGrading(false);

        answerRepository.save(answer);

        // Add feedback if provided
        if (request.getFeedbackText() != null && !request.getFeedbackText().trim().isEmpty()) {
            GradingFeedback feedback = GradingFeedback.builder()
                    .questionAnswer(answer)
                    .grader(grader)
                    .feedbackText(request.getFeedbackText())
                    .pointsAwarded(request.getPointsEarned())
                    .build();
            feedbackRepository.save(feedback);
        }

        // Log grading action
        GradingAction action = GradingAction.builder()
                .submission(submission)
                .questionAnswer(answer)
                .grader(grader)
                .actionType(GradingAction.ActionType.MANUAL_GRADE)
                .pointsBefore(previousPoints)
                .pointsAfter(request.getPointsEarned())
                .feedback(request.getFeedbackText())
                .notes(request.getInternalNotes())
                .build();
        gradingActionRepository.save(action);

        // Recalculate submission score
        recalculateSubmissionScore(submission);

        return convertAnswerToDTO(answer);
    }

    /**
     * Bulk grade multiple answers in a submission
     */
    @Transactional
    public QuizSubmissionDTO bulkGradeSubmission(BulkGradeRequest request) {
        QuizSubmission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User grader = getCurrentUser();

        if (!canGradeSubmission(submission, grader)) {
            throw new IllegalStateException("You don't have permission to grade this submission");
        }

        log.info("Bulk grading submission {} with {} answers", submission.getId(), request.getGrades().size());

        // Grade each answer
        for (ManualGradeRequest gradeRequest : request.getGrades()) {
            manuallyGradeAnswer(gradeRequest);
        }

        // Add overall feedback if provided
        if (request.getOverallFeedback() != null && !request.getOverallFeedback().trim().isEmpty()) {
            GradingAction action = GradingAction.builder()
                    .submission(submission)
                    .grader(grader)
                    .actionType(GradingAction.ActionType.FEEDBACK_ADDED)
                    .feedback(request.getOverallFeedback())
                    .build();
            gradingActionRepository.save(action);
        }

        // Reload submission to get updated data
        submission = submissionRepository.findById(request.getSubmissionId()).orElseThrow();

        return convertToDTO(submission);
    }

    /**
     * Finalize grading and optionally return results to participant
     */
    @Transactional
    public QuizSubmissionDTO finalizeGrading(FinalizeGradingRequest request) {
        QuizSubmission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User grader = getCurrentUser();

        if (!canGradeSubmission(submission, grader)) {
            throw new IllegalStateException("You don't have permission to finalize this grading");
        }

        // Check if all answers requiring manual grading have been graded
        long ungradedCount = answerRepository.countBySubmissionIdAndRequiresManualGradingTrue(submission.getId());
        if (ungradedCount > 0) {
            throw new IllegalStateException("Cannot finalize grading: " + ungradedCount + " answer(s) still require manual grading");
        }

        log.info("Finalizing grading for submission {}", submission.getId());

        // Recalculate final score
        recalculateSubmissionScore(submission);
        submission.markAsGraded();

        if (request.getReturnToParticipant()) {
            submission.returnToParticipant();

            // Update quiz assignment with final score and level
            QuizAssignment assignment = submission.getQuizAssignment();
            assignment.complete(submission.getFinalScore(), submission.getPassed());
            
            // Set level AFTER complete() call
            ParticipantLevel level = determineLevel(submission.getFinalScore(), submission.getQuestionnaire(), submission.getPassed());
            assignment.setLevel(level);
            
            // Explicitly save assignment to persist level
            quizAssignmentRepository.save(assignment);

            // Notify participant
            notificationService.createNotification(
                    submission.getParticipant(),
                    grader,
                    Notification.NotificationType.QUIZ_GRADED,
                    "Quiz Graded: " + submission.getQuestionnaire().getTitle(),
                    buildGradingCompleteMessage(submission, request.getFinalComments()),
                    Notification.RelatedEntityType.QUIZ_ASSIGNMENT,
                    submission.getQuizAssignment().getId()
            );
        }

        // Log finalization action
        GradingAction action = GradingAction.builder()
                .submission(submission)
                .grader(grader)
                .actionType(GradingAction.ActionType.FINALIZED)
                .feedback(request.getFinalComments())
                .pointsAfter(submission.getFinalScore())
                .build();
        gradingActionRepository.save(action);

        submissionRepository.save(submission);

        log.info("Grading finalized for submission {}. Final score: {}%", submission.getId(), submission.getFinalScore());

        return convertToDTO(submission);
    }

    /**
     * Get all submissions for a researcher
     */
    @Transactional(readOnly = true)
    public List<SubmissionSummaryDTO> getSubmissionsForResearcher() {
        User researcher = getCurrentUser();

        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can view submissions");
        }

        List<QuizSubmission> submissions = submissionRepository.findByResearcherId(researcher.getId());

        return submissions.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get submissions requiring manual grading
     */
    @Transactional(readOnly = true)
    public List<SubmissionSummaryDTO> getPendingManualGrading() {
        User researcher = getCurrentUser();

        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can view submissions");
        }

        List<QuizSubmission> submissions = submissionRepository.findByResearcherIdAndStatus(
                researcher.getId(),
                QuizSubmission.SubmissionStatus.SUBMITTED
        );

        return submissions.stream()
                .filter(QuizSubmission::getRequiresManualGrading)
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get detailed submission with all answers
     */
    @Transactional(readOnly = true)
    public QuizSubmissionDTO getSubmissionDetails(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User currentUser = getCurrentUser();

        if (!canViewSubmission(submission, currentUser)) {
            throw new IllegalStateException("You don't have permission to view this submission");
        }

        return convertToDTO(submission);
    }

    /**
     * Get grading history for a submission
     */
    @Transactional(readOnly = true)
    public List<GradingActionDTO> getGradingHistory(Long submissionId) {
        QuizSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found"));

        User currentUser = getCurrentUser();

        if (!canViewSubmission(submission, currentUser)) {
            throw new IllegalStateException("You don't have permission to view grading history");
        }

        List<GradingAction> actions = gradingActionRepository.findBySubmissionIdOrderByGradedAtDesc(submissionId);

        return actions.stream()
                .map(this::convertGradingActionToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all grading actions for the current researcher
     */
    @Transactional(readOnly = true)
    public List<GradingActionDTO> getAllGradingActionsForResearcher() {
        User researcher = getCurrentUser();

        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can export grading actions");
        }

        // Get all grading actions for submissions owned by this researcher
        List<GradingAction> actions = gradingActionRepository.findByResearcherIdOrderByGradedAtDesc(researcher.getId());

        return actions.stream()
                .map(this::convertGradingActionToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Export grading actions as PDF
     */
    @Transactional(readOnly = true)
    public byte[] exportGradingActionsAsPDF() throws IOException {
        List<GradingActionDTO> actions = getAllGradingActionsForResearcher();
        User researcher = getCurrentUser();

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
            contentStream.showText("Grading Actions Report");
            contentStream.endText();
            currentY -= 30;

            // Subtitle
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 12);
            contentStream.newLineAtOffset(margin, currentY);
            contentStream.showText("Generated by: " + researcher.getFullName());
            contentStream.endText();
            currentY -= 20;

            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 10);
            contentStream.newLineAtOffset(margin, currentY);
            contentStream.showText("Generated on: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            contentStream.endText();
            currentY -= 30;

                // Headers
                float[] colXPositions = {margin, margin + 60, margin + 140, margin + 250, margin + 350, margin + 450, margin + 510, margin + 570};
                String[] headers = {"ID", "Submission", "Graded At", "Grader", "Action Type", "Before", "After", "Feedback"};
                
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
                for (GradingActionDTO action : actions) {
                    if (currentY < 50) {
                        contentStream.close();
                        page = new PDPage();
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        currentY = 750;
                    }

                    // Prepare column values
                    String id = String.valueOf(action.getId());
                    String submissionId = String.valueOf(action.getSubmissionId());
                    String gradedAt = action.getGradedAt() != null
                        ? action.getGradedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : "";
                    String graderName = action.getGraderName() != null && action.getGraderName().length() > 12
                        ? action.getGraderName().substring(0, 12) + "..."
                        : (action.getGraderName() != null ? action.getGraderName() : "");
                    String actionType = action.getActionType() != null ? action.getActionType().name() : "";
                    String pointsBefore = action.getPointsBefore() != null ? String.format("%.1f", action.getPointsBefore()) : "";
                    String pointsAfter = action.getPointsAfter() != null ? String.format("%.1f", action.getPointsAfter()) : "";
                    String feedback = action.getFeedback() != null && action.getFeedback().length() > 20
                        ? action.getFeedback().substring(0, 17) + "..."
                        : (action.getFeedback() != null ? action.getFeedback() : "");

                    String[] values = {id, submissionId, gradedAt, graderName, actionType, pointsBefore, pointsAfter, feedback};
                    
                    // Write each column
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
     * Export grading actions as Excel
     */
    @Transactional(readOnly = true)
    public byte[] exportGradingActionsAsExcel() throws IOException {
        List<GradingActionDTO> actions = getAllGradingActionsForResearcher();
        User researcher = getCurrentUser();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Grading Actions");

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
                "ID", "Submission ID", "Question Answer ID", "Grader ID", "Grader Name",
                "Action Type", "Points Before", "Points After", "Feedback", "Notes", "Graded At"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (GradingActionDTO action : actions) {
                Row row = sheet.createRow(rowNum++);
                int colNum = 0;

                // ID - convert Long to String
                row.createCell(colNum++).setCellValue(action.getId() != null ? String.valueOf(action.getId()) : "");
                
                // Submission ID - convert Long to String
                row.createCell(colNum++).setCellValue(action.getSubmissionId() != null ? String.valueOf(action.getSubmissionId()) : "");
                
                // Question Answer ID - convert Long to String
                row.createCell(colNum++).setCellValue(action.getQuestionAnswerId() != null ? String.valueOf(action.getQuestionAnswerId()) : "");
                
                // Grader ID - convert Long to String
                row.createCell(colNum++).setCellValue(action.getGraderId() != null ? String.valueOf(action.getGraderId()) : "");
                
                // Grader Name - String
                row.createCell(colNum++).setCellValue(action.getGraderName() != null ? action.getGraderName() : "");
                
                // Action Type - String
                row.createCell(colNum++).setCellValue(action.getActionType() != null ? action.getActionType().name() : "");
                
                // Points Before - Double (numeric)
                if (action.getPointsBefore() != null) {
                    row.createCell(colNum++).setCellValue(action.getPointsBefore());
                } else {
                    row.createCell(colNum++).setCellValue(0.0);
                }
                
                // Points After - Double (numeric)
                if (action.getPointsAfter() != null) {
                    row.createCell(colNum++).setCellValue(action.getPointsAfter());
                } else {
                    row.createCell(colNum++).setCellValue(0.0);
                }
                
                // Feedback - String
                row.createCell(colNum++).setCellValue(action.getFeedback() != null ? action.getFeedback() : "");
                
                // Notes - String
                row.createCell(colNum++).setCellValue(action.getNotes() != null ? action.getNotes() : "");
                
                // Graded At - String (formatted date)
                row.createCell(colNum++).setCellValue(
                    action.getGradedAt() != null ? action.getGradedAt().format(formatter) : ""
                );

                // Apply style to all cells
                for (int i = 0; i < headers.length; i++) {
                    row.getCell(i).setCellStyle(dataStyle);
                }
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // Set minimum width
                if (sheet.getColumnWidth(i) < 2000) {
                    sheet.setColumnWidth(i, 2000);
                }
            }

            // Add metadata sheet
            Sheet metadataSheet = workbook.createSheet("Metadata");
            Row metaRow1 = metadataSheet.createRow(0);
            metaRow1.createCell(0).setCellValue("Generated by:");
            metaRow1.createCell(1).setCellValue(researcher.getFullName());
            
            Row metaRow2 = metadataSheet.createRow(1);
            metaRow2.createCell(0).setCellValue("Generated on:");
            metaRow2.createCell(1).setCellValue(LocalDateTime.now().format(formatter));
            
            Row metaRow3 = metadataSheet.createRow(2);
            metaRow3.createCell(0).setCellValue("Total Actions:");
            metaRow3.createCell(1).setCellValue(actions.size());

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    // Helper methods

    private void recalculateSubmissionScore(QuizSubmission submission) {
        Double totalEarned = answerRepository.sumPointsEarnedBySubmission(submission.getId());
        submission.setTotalPointsEarned(totalEarned != null ? totalEarned.intValue() : 0);

        if (submission.getTotalPointsPossible() > 0) {
            double percentage = (totalEarned * 100.0) / submission.getTotalPointsPossible();
            submission.setManualScore(percentage);
            submission.calculateFinalScore();
        }

        submission.setRequiresManualGrading(
                answerRepository.countBySubmissionIdAndRequiresManualGradingTrue(submission.getId()) > 0
        );

        submissionRepository.save(submission);
    }

    private boolean canGradeSubmission(QuizSubmission submission, User user) {
        if (!user.getRole().equals(User.Role.RESEARCHER)) {
            return false;
        }
        return submission.getQuestionnaire().getResearcher().getId().equals(user.getId());
    }

    private boolean canViewSubmission(QuizSubmission submission, User user) {
        if (user.getRole().equals(User.Role.RESEARCHER)) {
            return submission.getQuestionnaire().getResearcher().getId().equals(user.getId());
        } else if (user.getRole().equals(User.Role.PARTICIPANT)) {
            return submission.getParticipant().getId().equals(user.getId());
        }
        return false;
    }

    private String buildGradingCompleteMessage(QuizSubmission submission, String finalComments) {
        StringBuilder message = new StringBuilder();
        message.append("Your quiz \"").append(submission.getQuestionnaire().getTitle()).append("\" has been graded.\n\n");
        message.append("Final Score: ").append(String.format("%.2f", submission.getFinalScore())).append("%\n");
        message.append("Points Earned: ").append(submission.getTotalPointsEarned())
                .append(" / ").append(submission.getTotalPointsPossible()).append("\n");

        if (submission.getPassed() != null) {
            message.append("Status: ").append(submission.getPassed() ? "PASSED" : "NOT PASSED").append("\n");
        }

        if (finalComments != null && !finalComments.trim().isEmpty()) {
            message.append("\nComments from Grader:\n").append(finalComments);
        }

        return message.toString();
    }

    private QuizSubmissionDTO convertToDTO(QuizSubmission submission) {
        List<QuestionAnswerDTO> answerDTOs = submission.getAnswers().stream()
                .map(this::convertAnswerToDTO)
                .collect(Collectors.toList());

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
                .answers(answerDTOs)
                .build();
    }

    private QuestionAnswerDTO convertAnswerToDTO(QuestionAnswer answer) {
        List<GradingFeedbackDTO> feedbackDTOs = answer.getFeedbackList().stream()
                .map(this::convertFeedbackToDTO)
                .collect(Collectors.toList());

        List<QuestionOptionSummaryDTO> optionDTOs = answer.getQuestion().getOptions().stream()
                .map(this::convertOptionToDTO)
                .collect(Collectors.toList());

        return QuestionAnswerDTO.builder()
                .id(answer.getId())
                .submissionId(answer.getSubmission().getId())
                .questionId(answer.getQuestion().getId())
                .questionText(answer.getQuestion().getQuestionText())
                .questionType(answer.getQuestion().getType().name())
                .answerText(answer.getAnswerText())
                .selectedOptionIds(answer.getSelectedOptionIdList())
                .isCorrect(answer.getIsCorrect())
                .pointsEarned(answer.getPointsEarned())
                .pointsPossible(answer.getPointsPossible())
                .requiresManualGrading(answer.getRequiresManualGrading())
                .answeredAt(answer.getAnsweredAt())
                .feedbackList(feedbackDTOs)
                .correctAnswer(answer.getQuestion().getCorrectAnswer())
                .options(optionDTOs)
                .build();
    }

    private GradingFeedbackDTO convertFeedbackToDTO(GradingFeedback feedback) {
        return GradingFeedbackDTO.builder()
                .id(feedback.getId())
                .questionAnswerId(feedback.getQuestionAnswer().getId())
                .graderId(feedback.getGrader().getId())
                .graderName(feedback.getGrader().getFullName())
                .feedbackText(feedback.getFeedbackText())
                .pointsAwarded(feedback.getPointsAwarded())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private QuestionOptionSummaryDTO convertOptionToDTO(QuestionOption option) {
        return QuestionOptionSummaryDTO.builder()
                .id(option.getId())
                .optionText(option.getOptionText())
                .isCorrect(option.getIsCorrect())
                .displayOrder(option.getDisplayOrder())
                .build();
    }

    private GradingActionDTO convertGradingActionToDTO(GradingAction action) {
        return GradingActionDTO.builder()
                .id(action.getId())
                .submissionId(action.getSubmission().getId())
                .questionAnswerId(action.getQuestionAnswer() != null ? action.getQuestionAnswer().getId() : null)
                .graderId(action.getGrader().getId())
                .graderName(action.getGrader().getFullName())
                .actionType(action.getActionType())
                .pointsBefore(action.getPointsBefore())
                .pointsAfter(action.getPointsAfter())
                .feedback(action.getFeedback())
                .notes(action.getNotes())
                .gradedAt(action.getGradedAt())
                .build();
    }

    private SubmissionSummaryDTO convertToSummaryDTO(QuizSubmission submission) {
        long questionsRequiringGrading = answerRepository.countBySubmissionIdAndRequiresManualGradingTrue(submission.getId());

        return SubmissionSummaryDTO.builder()
                .id(submission.getId())
                .participantId(submission.getParticipant().getId())
                .participantName(submission.getParticipant().getFullName())
                .participantEmail(submission.getParticipant().getEmail())
                .questionnaireId(submission.getQuestionnaire().getId())
                .questionnaireTitle(submission.getQuestionnaire().getTitle())
                .attemptNumber(submission.getAttemptNumber())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .finalScore(submission.getFinalScore())
                .passed(submission.getPassed())
                .requiresManualGrading(submission.getRequiresManualGrading())
                .questionsRequiringGrading((int) questionsRequiringGrading)
                .totalQuestions(submission.getAnswers().size())
                .build();
    }

    private ParticipantLevel determineLevel(Double score, Questionnaire questionnaire, Boolean passed) {
        if (score == null || passed == null || !passed) {
            return null;
        }
        
        // Only determine level for COMPETENCY quizzes
        if (questionnaire.getType() != Questionnaire.QuestionnaireType.COMPETENCY) {
            return null;
        }
        
        log.debug("Determining level for score: {}, advancedThreshold: {}, intermediateThreshold: {}", 
                score, questionnaire.getAdvancedThreshold(), questionnaire.getIntermediateThreshold());
        
        if (questionnaire.getAdvancedThreshold() != null && score >= questionnaire.getAdvancedThreshold()) {
            log.debug("Assigning ADVANCED level");
            return ParticipantLevel.ADVANCED;
        } else if (questionnaire.getIntermediateThreshold() != null && score >= questionnaire.getIntermediateThreshold()) {
            log.debug("Assigning INTERMEDIATE level");
            return ParticipantLevel.INTERMEDIATE;
        } else {
            log.debug("Assigning BEGINNER level");
            return ParticipantLevel.BEGINNER;
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
}
