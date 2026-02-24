package com.artifactcomparator.service;

import com.artifactcomparator.dto.QuizAssignmentDTO;
import com.artifactcomparator.dto.QuizAssignmentResponseDTO;
import com.artifactcomparator.dto.StudyQuizAssignmentRequest;
import com.artifactcomparator.dto.StudyQuizAttachRequest;
import com.artifactcomparator.dto.StudyQuizDTO;
import com.artifactcomparator.model.Questionnaire;
import com.artifactcomparator.model.QuizAssignment;
import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.StudyEnrollment;
import com.artifactcomparator.model.StudyQuiz;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.QuestionnaireRepository;
import com.artifactcomparator.repository.QuizAssignmentRepository;
import com.artifactcomparator.repository.StudyEnrollmentRepository;
import com.artifactcomparator.repository.StudyQuizRepository;
import com.artifactcomparator.repository.StudyRepository;
import com.artifactcomparator.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyQuizService {

    private final StudyRepository studyRepository;
    private final QuestionnaireRepository questionnaireRepository;
    private final StudyQuizRepository studyQuizRepository;
    private final StudyEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final QuizAssignmentService quizAssignmentService;
    private final QuizAssignmentRepository quizAssignmentRepository;

    private static final Set<StudyEnrollment.EnrollmentStatus> ASSIGNMENT_ELIGIBLE_STATUSES =
            EnumSet.of(
                    StudyEnrollment.EnrollmentStatus.ENROLLED,
                    StudyEnrollment.EnrollmentStatus.IN_PROGRESS,
                    StudyEnrollment.EnrollmentStatus.COMPLETED
            );

    @Transactional
    public StudyQuizDTO attachQuiz(Long studyId, StudyQuizAttachRequest request) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        User currentUser = getCurrentUser();
        enforceStudyOwnership(study, currentUser);

        Questionnaire questionnaire = questionnaireRepository.findById(request.getQuestionnaireId())
                .orElseThrow(() -> new IllegalArgumentException("Questionnaire not found"));

        if (!questionnaire.getResearcher().getId().equals(study.getResearcher().getId())) {
            throw new IllegalStateException("Only questionnaires created by this study's researcher can be attached");
        }

        if (studyQuizRepository.existsByStudyIdAndQuestionnaireId(studyId, questionnaire.getId())) {
            throw new IllegalStateException("This questionnaire is already attached to the study");
        }

        int displayOrder = Optional.ofNullable(request.getDisplayOrder())
                .orElse((int) studyQuizRepository.countByStudyId(studyId));

        StudyQuiz studyQuiz = StudyQuiz.builder()
                .study(study)
                .questionnaire(questionnaire)
                .displayOrder(displayOrder)
                .build();

        StudyQuiz saved = studyQuizRepository.save(studyQuiz);
        return mapToDTO(saved);
    }

    @Transactional
    public void removeStudyQuiz(Long studyId, Long studyQuizId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        User currentUser = getCurrentUser();
        enforceStudyOwnership(study, currentUser);

        StudyQuiz studyQuiz = studyQuizRepository.findByIdAndStudyId(studyQuizId, studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study quiz association not found"));

        studyQuizRepository.delete(studyQuiz);
    }

    @Transactional
    public QuizAssignmentResponseDTO assignStudyQuiz(Long studyId,
                                                     Long studyQuizId,
                                                     StudyQuizAssignmentRequest request) {
        if (request.getParticipantIds() == null || request.getParticipantIds().isEmpty()) {
            throw new IllegalArgumentException("At least one participant must be selected");
        }

        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        User currentUser = getCurrentUser();
        enforceStudyOwnership(study, currentUser);

        StudyQuiz studyQuiz = studyQuizRepository.findByIdAndStudyId(studyQuizId, studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study quiz association not found"));

        validateParticipantsEnrollment(studyId, request.getParticipantIds());

        com.artifactcomparator.dto.QuizAssignmentCreateDTO dto = new com.artifactcomparator.dto.QuizAssignmentCreateDTO();
        dto.setQuestionnaireId(studyQuiz.getQuestionnaire().getId());
        dto.setParticipantIds(request.getParticipantIds());
        dto.setStudyId(studyId);
        dto.setDueDate(request.getDueDate());
        int attempts = request.getMaxAttempts() != null && request.getMaxAttempts() > 0
                ? request.getMaxAttempts()
                : 1;
        dto.setMaxAttempts(attempts);
        dto.setAllowRetake(Boolean.TRUE.equals(request.getAllowRetake()));
        dto.setNotes(request.getNotes());

        return quizAssignmentService.assignQuizToParticipants(dto);
    }

    @Transactional
    public List<StudyQuizDTO> getStudyQuizzes(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        User currentUser = getCurrentUser();
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isParticipant = currentUser.getRole() == User.Role.PARTICIPANT;

        if (!isOwner && !isAdmin && !isParticipant) {
            throw new IllegalStateException("Not authorized to view study quizzes");
        }

        if (isParticipant) {
            boolean enrolled = enrollmentRepository.findByStudyIdAndParticipantId(studyId, currentUser.getId()).isPresent();
            if (!enrolled) {
                throw new IllegalStateException("Participants must be enrolled in the study to view its quizzes");
            }
        }

        return studyQuizRepository.findByStudyIdOrderByDisplayOrderAsc(studyId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<QuizAssignmentDTO> getStudyQuizAssignments(Long studyId, Long studyQuizId) {
        // Verify study exists
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Verify study quiz exists
        StudyQuiz studyQuiz = studyQuizRepository.findById(studyQuizId)
                .orElseThrow(() -> new IllegalArgumentException("Study quiz not found"));

        // Verify the quiz belongs to the study
        if (!studyQuiz.getStudy().getId().equals(studyId)) {
            throw new IllegalArgumentException("Quiz does not belong to this study");
        }

        // Get all quiz assignments for this questionnaire and study
        List<QuizAssignment> assignments = quizAssignmentRepository.findByQuestionnaireIdOrderByAssignedAtDesc(
                studyQuiz.getQuestionnaire().getId()
        );

        // Filter by study and convert to DTOs
        return assignments.stream()
                .filter(a -> a.getStudy() != null && a.getStudy().getId().equals(studyId))
                .map(this::convertToQuizAssignmentDTO)
                .collect(Collectors.toList());
    }

    private QuizAssignmentDTO convertToQuizAssignmentDTO(QuizAssignment assignment) {
        QuizAssignmentDTO dto = new QuizAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setParticipantId(assignment.getParticipant().getId());
        dto.setParticipantName(assignment.getParticipant().getFullName());
        dto.setParticipantEmail(assignment.getParticipant().getEmail());
        dto.setQuestionnaireId(assignment.getQuestionnaire().getId());
        dto.setQuestionnaireTitle(assignment.getQuestionnaire().getTitle());
        dto.setStatus(assignment.getStatus());
        dto.setAssignedAt(assignment.getAssignedAt());
        dto.setDueDate(assignment.getDueDate());
        dto.setCompletedAt(assignment.getCompletedAt());
        dto.setMaxAttempts(assignment.getMaxAttempts());
        dto.setAllowRetake(assignment.getAllowRetake());
        dto.setNotes(assignment.getNotes());
        if (assignment.getStudy() != null) {
            dto.setStudyId(assignment.getStudy().getId());
            dto.setStudyTitle(assignment.getStudy().getTitle());
        }
        return dto;
    }

    private void validateParticipantsEnrollment(Long studyId, List<Long> participantIds) {
        for (Long participantId : participantIds) {
            Optional<StudyEnrollment> enrollmentOpt = enrollmentRepository.findByStudyIdAndParticipantId(studyId, participantId);
            if (enrollmentOpt.isEmpty()) {
                throw new IllegalStateException("Participant " + participantId + " is not enrolled in this study");
            }

            StudyEnrollment.EnrollmentStatus status = enrollmentOpt.get().getStatus();
            if (!ASSIGNMENT_ELIGIBLE_STATUSES.contains(status)) {
                throw new IllegalStateException("Participant " + participantId + " is not eligible for quiz assignments in status " + status);
            }
        }
    }

    private void enforceStudyOwnership(Study study, User currentUser) {
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new IllegalStateException("Only the study owner or an admin can modify study quizzes");
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Authentication required");
        }

        String identifier = authentication.getName();
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    private StudyQuizDTO mapToDTO(StudyQuiz studyQuiz) {
        Questionnaire questionnaire = studyQuiz.getQuestionnaire();
        return StudyQuizDTO.builder()
                .id(studyQuiz.getId())
                .studyId(studyQuiz.getStudy().getId())
                .questionnaireId(questionnaire.getId())
                .questionnaireTitle(questionnaire.getTitle())
                .questionnaireDescription(questionnaire.getDescription())
                .questionnaireType(questionnaire.getType().name())
                .questionnaireActive(questionnaire.getIsActive())
                .questionCount(questionnaire.getQuestions() != null ? questionnaire.getQuestions().size() : null)
                .timeLimitMinutes(questionnaire.getTimeLimitMinutes())
                .displayOrder(studyQuiz.getDisplayOrder())
                .attachedAt(studyQuiz.getCreatedAt())
                .build();
    }
}
