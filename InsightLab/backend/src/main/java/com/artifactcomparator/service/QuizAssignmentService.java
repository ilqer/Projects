package com.artifactcomparator.service;

import com.artifactcomparator.dto.QuizAssignmentCreateDTO;
import com.artifactcomparator.dto.QuizAssignmentDTO;
import com.artifactcomparator.dto.QuizAssignmentResponseDTO;
import com.artifactcomparator.model.*;
import com.artifactcomparator.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizAssignmentService {

    private final QuizAssignmentRepository quizAssignmentRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final UserRepository userRepository;
    private final StudyRepository studyRepository;
    private final StudyEnrollmentRepository studyEnrollmentRepository;
    private final NotificationService notificationService;
    private static final Set<StudyEnrollment.EnrollmentStatus> STUDY_ASSIGNABLE_STATUSES =
            EnumSet.of(
                    StudyEnrollment.EnrollmentStatus.ENROLLED,
                    StudyEnrollment.EnrollmentStatus.IN_PROGRESS,
                    StudyEnrollment.EnrollmentStatus.COMPLETED
            );

    @Transactional
    public QuizAssignmentResponseDTO assignQuizToParticipants(QuizAssignmentCreateDTO dto) {
        User researcher = getCurrentUser();

        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can assign quizzes");
        }

        Questionnaire questionnaire = questionnaireRepository.findById(dto.getQuestionnaireId())
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));

        if (!questionnaire.getResearcher().getId().equals(researcher.getId())) {
            throw new IllegalStateException("You can only assign your own questionnaires");
        }

        Study study = null;
        if (dto.getStudyId() != null) {
            study = studyRepository.findById(dto.getStudyId())
                    .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        }

        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        for (Long participantId : dto.getParticipantIds()) {
            try {
                User participant = userRepository.findById(participantId)
                        .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + participantId));

                if (!participant.getRole().equals(User.Role.PARTICIPANT)) {
                    errors.add("User " + participantId + " is not a participant");
                    failureCount++;
                    continue;
                }

                if (study != null) {
                    StudyEnrollment enrollment = studyEnrollmentRepository
                            .findByStudyIdAndParticipantId(study.getId(), participantId)
                            .orElse(null);

                    if (enrollment == null) {
                        errors.add("Participant " + participant.getFullName() + " is not enrolled in this study");
                        failureCount++;
                        continue;
                    }

                    if (!STUDY_ASSIGNABLE_STATUSES.contains(enrollment.getStatus())) {
                        errors.add("Participant " + participant.getFullName() + " must accept the study invitation before receiving quizzes");
                        failureCount++;
                        continue;
                    }
                }

                // Check if already assigned
                if (quizAssignmentRepository.existsByParticipantIdAndQuestionnaireId(participantId, dto.getQuestionnaireId())) {
                    errors.add("Quiz already assigned to participant " + participant.getFullName());
                    failureCount++;
                    continue;
                }

                // Create assignment
                QuizAssignment assignment = QuizAssignment.builder()
                        .questionnaire(questionnaire)
                        .participant(participant)
                        .researcher(researcher)
                        .study(study)
                        .dueDate(dto.getDueDate())
                        .maxAttempts(dto.getMaxAttempts())
                        .allowRetake(dto.getAllowRetake())
                        .notes(dto.getNotes())
                        .build();
                assignment.accept();
                QuizAssignment saved = quizAssignmentRepository.save(assignment);

                // Create notification for participant
                String notificationMessage = buildQuizAssignmentMessage(questionnaire, dto, study);
                notificationService.createNotification(
                        participant,
                        researcher,
                        Notification.NotificationType.QUIZ_INVITATION,
                        "Quiz Assigned: " + questionnaire.getTitle(),
                        notificationMessage,
                        Notification.RelatedEntityType.QUIZ_ASSIGNMENT,
                        saved.getId()
                );

                successCount++;

            } catch (Exception e) {
                errors.add("Failed to assign quiz to participant " + participantId + ": " + e.getMessage());
                failureCount++;
            }
        }

        String message = String.format("Quiz assigned to %d participant(s). Success: %d, Failed: %d",
                dto.getParticipantIds().size(), successCount, failureCount);

        if (!errors.isEmpty()) {
            message += "\nErrors: " + String.join("; ", errors);
        }

        return new QuizAssignmentResponseDTO(message, dto.getParticipantIds().size(), successCount, failureCount);
    }

    @Transactional
    public QuizAssignmentDTO acceptQuizAssignment(Long assignmentId) {
        QuizAssignment assignment = quizAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz assignment not found"));

        User currentUser = getCurrentUser();
        if (!assignment.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only accept your own quiz assignments");
        }

        if (assignment.getStatus() != QuizAssignment.AssignmentStatus.PENDING) {
            throw new IllegalStateException("This assignment has already been responded to");
        }

        assignment.accept();
        QuizAssignment updated = quizAssignmentRepository.save(assignment);

        // Notify researcher
        notificationService.createNotification(
                assignment.getResearcher(),
                currentUser,
                Notification.NotificationType.QUIZ_INVITATION_ACCEPTED,
                "Quiz Invitation Accepted",
                currentUser.getFullName() + " has accepted the quiz invitation for \"" +
                        assignment.getQuestionnaire().getTitle() + "\"",
                Notification.RelatedEntityType.QUIZ_ASSIGNMENT,
                assignment.getId()
        );

        return convertToDTO(updated);
    }

    @Transactional
    public QuizAssignmentDTO declineQuizAssignment(Long assignmentId, String reason) {
        QuizAssignment assignment = quizAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz assignment not found"));

        User currentUser = getCurrentUser();
        if (!assignment.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only decline your own quiz assignments");
        }

        if (assignment.getStatus() != QuizAssignment.AssignmentStatus.PENDING) {
            throw new IllegalStateException("This assignment has already been responded to");
        }

        assignment.decline(reason);
        QuizAssignment updated = quizAssignmentRepository.save(assignment);

        // Notify researcher
        String declineMessage = currentUser.getFullName() + " has declined the quiz invitation for \"" +
                assignment.getQuestionnaire().getTitle() + "\"";
        if (reason != null && !reason.trim().isEmpty()) {
            declineMessage += "\nReason: " + reason;
        }

        notificationService.createNotification(
                assignment.getResearcher(),
                currentUser,
                Notification.NotificationType.QUIZ_INVITATION_DECLINED,
                "Quiz Invitation Declined",
                declineMessage,
                Notification.RelatedEntityType.QUIZ_ASSIGNMENT,
                assignment.getId()
        );

        return convertToDTO(updated);
    }

    @Transactional(readOnly = true)
    public List<QuizAssignmentDTO> getMyQuizAssignments() {
        User currentUser = getCurrentUser();

        if (currentUser.getRole().equals(User.Role.RESEARCHER)) {
            return quizAssignmentRepository.findByResearcherIdOrderByAssignedAtDesc(currentUser.getId())
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } else if (currentUser.getRole().equals(User.Role.PARTICIPANT)) {
            return quizAssignmentRepository.findByParticipantIdOrderByAssignedAtDesc(currentUser.getId())
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    @Transactional(readOnly = true)
    public List<QuizAssignmentDTO> getAssignmentsByStatus(QuizAssignment.AssignmentStatus status) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole().equals(User.Role.RESEARCHER)) {
            return quizAssignmentRepository.findByResearcherIdAndStatusOrderByAssignedAtDesc(currentUser.getId(), status)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } else if (currentUser.getRole().equals(User.Role.PARTICIPANT)) {
            return quizAssignmentRepository.findByParticipantIdAndStatusOrderByAssignedAtDesc(currentUser.getId(), status)
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }

        return new ArrayList<>();
    }

    @Transactional(readOnly = true)
    public QuizAssignmentDTO getAssignmentById(Long assignmentId) {
        QuizAssignment assignment = quizAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz assignment not found"));

        User currentUser = getCurrentUser();
        if (!assignment.getParticipant().getId().equals(currentUser.getId()) &&
                !assignment.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You don't have permission to view this assignment");
        }

        return convertToDTO(assignment);
    }

    @Transactional(readOnly = true)
    public List<QuizAssignmentDTO> getAssignmentsByQuestionnaire(Long questionnaireId) {
        User currentUser = getCurrentUser();
        Questionnaire questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));

        if (!questionnaire.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only view assignments for your own questionnaires");
        }

        return quizAssignmentRepository.findByQuestionnaireIdOrderByAssignedAtDesc(questionnaireId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAssignment(Long assignmentId) {
        QuizAssignment assignment = quizAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz assignment not found"));

        User currentUser = getCurrentUser();
        if (!assignment.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Only the researcher can delete this assignment");
        }

        if (assignment.getStatus() == QuizAssignment.AssignmentStatus.COMPLETED ||
                assignment.getStatus() == QuizAssignment.AssignmentStatus.IN_PROGRESS) {
            throw new IllegalStateException("Cannot delete a completed or in-progress assignment");
        }

        quizAssignmentRepository.delete(assignment);
    }

    @Transactional(readOnly = true)
    public List<QuizAssignmentDTO> getAssignmentsByStudy(Long studyId) {
        User currentUser = getCurrentUser();

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new IllegalStateException("You don't have permission to view assignments for this study");
        }

        return quizAssignmentRepository.findByStudyId(studyId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods

    private String buildQuizAssignmentMessage(Questionnaire questionnaire, QuizAssignmentCreateDTO dto, Study study) {
        StringBuilder message = new StringBuilder();
        message.append("You have been assigned the quiz \"").append(questionnaire.getTitle()).append("\"");

        if (study != null) {
            message.append(" as part of the study \"").append(study.getTitle()).append("\"");
        }

        message.append(".\n\n");

        if (questionnaire.getDescription() != null && !questionnaire.getDescription().isEmpty()) {
            message.append("Description: ").append(questionnaire.getDescription()).append("\n\n");
        }

        message.append("Details:\n");
        message.append("- Questions: ").append(questionnaire.getQuestions().size()).append("\n");

        if (questionnaire.getTimeLimitMinutes() != null) {
            message.append("- Time Limit: ").append(questionnaire.getTimeLimitMinutes()).append(" minutes\n");
        }

        if (questionnaire.getTotalPoints() != null) {
            message.append("- Total Points: ").append(questionnaire.getTotalPoints()).append("\n");
        }

        if (questionnaire.getPassingThreshold() != null) {
            message.append("- Passing Threshold: ").append(questionnaire.getPassingThreshold()).append("%\n");
        }

        if (dto.getDueDate() != null) {
            message.append("- Due Date: ").append(dto.getDueDate()).append("\n");
        }

        if (dto.getMaxAttempts() != null && dto.getMaxAttempts() > 1) {
            message.append("- Max Attempts: ").append(dto.getMaxAttempts()).append("\n");
        }

        if (dto.getNotes() != null && !dto.getNotes().isEmpty()) {
            message.append("\nNotes from Researcher:\n").append(dto.getNotes());
        }

        return message.toString();
    }

    private QuizAssignmentDTO convertToDTO(QuizAssignment assignment) {
        return QuizAssignmentDTO.builder()
                .id(assignment.getId())
                .questionnaireId(assignment.getQuestionnaire().getId())
                .questionnaireTitle(assignment.getQuestionnaire().getTitle())
                .questionnaireDescription(assignment.getQuestionnaire().getDescription())
                .participantId(assignment.getParticipant().getId())
                .participantName(assignment.getParticipant().getFullName())
                .participantEmail(assignment.getParticipant().getEmail())
                .researcherId(assignment.getResearcher().getId())
                .researcherName(assignment.getResearcher().getFullName())
                .studyId(assignment.getStudy() != null ? assignment.getStudy().getId() : null)
                .studyTitle(assignment.getStudy() != null ? assignment.getStudy().getTitle() : null)
                .status(assignment.getStatus())
                .dueDate(assignment.getDueDate())
                .maxAttempts(assignment.getMaxAttempts())
                .attemptsTaken(assignment.getAttemptsTaken())
                .allowRetake(assignment.getAllowRetake())
                .assignedAt(assignment.getAssignedAt())
                .acceptedAt(assignment.getAcceptedAt())
                .declinedAt(assignment.getDeclinedAt())
                .completedAt(assignment.getCompletedAt())
                .score(assignment.getScore())
                .passed(assignment.getPassed())
                .notes(assignment.getNotes())
                .declineReason(assignment.getDeclineReason())
                .overdue(assignment.isOverdue())
                .canRetake(assignment.canRetake())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
}
