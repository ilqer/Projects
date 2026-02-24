package com.artifactcomparator.service;

import com.artifactcomparator.dto.*;
import com.artifactcomparator.model.*;
import com.artifactcomparator.model.QuizAssignment;
import com.artifactcomparator.model.Study.StudyStatus;
import com.artifactcomparator.model.evaluation.EvaluationTask;
import com.artifactcomparator.model.evaluation.ParticipantTaskAssignment;
import com.artifactcomparator.model.evaluation.EvaluationSubmission;
import com.artifactcomparator.repository.*;
import com.artifactcomparator.repository.evaluation.EvaluationTaskRepository;
import com.artifactcomparator.repository.evaluation.ParticipantTaskAssignmentRepository;
import com.artifactcomparator.repository.evaluation.EvaluationSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.artifactcomparator.model.Study.StudyStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyService {
    
    private final StudyRepository studyRepository;
    private final UserRepository userRepository;
    private final StudyEnrollmentRepository enrollmentRepository;
    private final EvaluationCriterionRepository evaluationCriterionRepository;
    private final StudyArtifactRepository studyArtifactRepository;
    private final ArtifactRepository artifactRepository;
    private final ParticipantEvaluationReviewRepository evaluationReviewRepository;
    private final ParticipantTaskAssignmentRepository taskAssignmentRepository;
    private final EvaluationTaskRepository evaluationTaskRepository;
    private final StudyQuizRepository studyQuizRepository;
    private final QuizAssignmentRepository quizAssignmentRepository;
    private final EvaluationSubmissionRepository evaluationSubmissionRepository;
    private final QuizSubmissionRepository quizSubmissionRepository;
    private final NotificationService notificationService;

    
    @Transactional
    public StudyResponseDTO createStudy(StudyCreateDTO studyCreateDTO) {
        User researcher = getCurrentUser();
        
        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can create studies");
        }
        
        // Validate start date is not in the past
        if (studyCreateDTO.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }
        
        // Validate end date is after start date
        if (studyCreateDTO.getEndDate() != null && 
            studyCreateDTO.getEndDate().isBefore(studyCreateDTO.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        
        Study study = new Study();
        study.setTitle(studyCreateDTO.getTitle());
        study.setDescription(studyCreateDTO.getDescription());
        study.setObjective(studyCreateDTO.getObjective());
        study.setStartDate(studyCreateDTO.getStartDate());
        study.setEndDate(studyCreateDTO.getEndDate());
        study.setStatus(StudyStatus.DRAFT);
        study.setResearcher(researcher);
        study.setComparisonType(studyCreateDTO.getComparisonType());
        study.setBlindedMode(studyCreateDTO.getBlindedMode() != null ? studyCreateDTO.getBlindedMode() : false);
        study.setMaxParticipants(studyCreateDTO.getMaxParticipants());
        
        Study savedStudy = studyRepository.save(study);
        
        // Save custom evaluation criteria
        if (studyCreateDTO.getCustomCriteria() != null && !studyCreateDTO.getCustomCriteria().isEmpty()) {
            saveCustomCriteria(savedStudy, studyCreateDTO.getCustomCriteria());
        }
        
        // Save study artifacts
        if (studyCreateDTO.getArtifacts() != null && !studyCreateDTO.getArtifacts().isEmpty()) {
            saveStudyArtifacts(savedStudy, studyCreateDTO.getArtifacts());
        }
        
        return convertToResponseDTO(savedStudy);
    }
    
    private void saveCustomCriteria(Study study, List<EvaluationCriterionDTO> criteriaList) {
        for (int i = 0; i < criteriaList.size(); i++) {
            EvaluationCriterionDTO dto = criteriaList.get(i);
            EvaluationCriterion criterion = new EvaluationCriterion();
            criterion.setStudy(study);
            criterion.setName(dto.getName());
            criterion.setDescription(dto.getDescription());
            criterion.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : i);
            
            try {
                criterion.setRatingFormat(EvaluationCriterion.RatingFormat.valueOf(dto.getRatingFormat()));
            } catch (IllegalArgumentException e) {
                criterion.setRatingFormat(EvaluationCriterion.RatingFormat.FIVE_STAR);
            }
            
            criterion.setRatingOptions(dto.getRatingOptions());
            evaluationCriterionRepository.save(criterion);
        }
    }
    
    private void saveStudyArtifacts(Study study, List<StudyArtifactDTO> artifactList) {
        for (int i = 0; i < artifactList.size(); i++) {
            StudyArtifactDTO dto = artifactList.get(i);
            Artifact artifact = artifactRepository.findById(dto.getArtifactId())
                    .orElseThrow(() -> new IllegalArgumentException("Artifact not found: " + dto.getArtifactId()));

            // Check if this artifact association already exists
            if (studyArtifactRepository.existsByStudyIdAndArtifactId(study.getId(), artifact.getId())) {
                // Skip if already associated - this prevents duplicate key constraint violations
                continue;
            }

            StudyArtifact studyArtifact = new StudyArtifact();
            studyArtifact.setStudy(study);
            studyArtifact.setArtifact(artifact);
            studyArtifact.setDisplayLabel(dto.getDisplayLabel());
            studyArtifact.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : i);
            studyArtifactRepository.save(studyArtifact);
        }
    }
    
    @Transactional
    public StudyResponseDTO updateStudy(Long studyId, StudyUpdateDTO studyUpdateDTO) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Check if user is the owner of the study or an admin
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new IllegalStateException("Only the study owner or an admin can update this study");
        }
        
        // Check if study can be edited based on status
        if (study.getStatus() == StudyStatus.COMPLETED || 
            study.getStatus() == StudyStatus.CANCELLED) {
            throw new IllegalStateException("Cannot edit " + study.getStatus().name().toLowerCase() + " studies. Only DRAFT, ACTIVE, and PAUSED studies can be edited.");
        }
        
        study.setTitle(studyUpdateDTO.getTitle());
        study.setDescription(studyUpdateDTO.getDescription());
        study.setObjective(studyUpdateDTO.getObjective());
        
        if (studyUpdateDTO.getStartDate() != null) {
            study.setStartDate(studyUpdateDTO.getStartDate());
        }
        
        study.setEndDate(studyUpdateDTO.getEndDate());
        study.setComparisonType(studyUpdateDTO.getComparisonType());
        study.setBlindedMode(studyUpdateDTO.getBlindedMode());
        study.setMaxParticipants(studyUpdateDTO.getMaxParticipants());
        
        // Update status if provided
        if (studyUpdateDTO.getStatus() != null) {
            try {
                StudyStatus newStatus = StudyStatus.valueOf(studyUpdateDTO.getStatus().toUpperCase());
                study.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid study status: " + studyUpdateDTO.getStatus());
            }
        }
        
        Study updatedStudy = studyRepository.save(study);
        
        // Update custom evaluation criteria
        if (studyUpdateDTO.getCustomCriteria() != null) {
            // Delete existing criteria and add new ones
            evaluationCriterionRepository.deleteByStudy(study);
            saveCustomCriteria(updatedStudy, studyUpdateDTO.getCustomCriteria());
        }
        
        // Update study artifacts
        if (studyUpdateDTO.getArtifacts() != null) {
            // Delete existing artifacts and add new ones
            studyArtifactRepository.deleteByStudy(study);
            saveStudyArtifacts(updatedStudy, studyUpdateDTO.getArtifacts());
        }
        
        return convertToResponseDTO(updatedStudy);
    }
    
    @Transactional(readOnly = true)
    public StudyResponseDTO getStudyById(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        return convertToResponseDTO(study);
    }
    
    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getAllStudies() {
        return studyRepository.findAll().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getMyStudies() {
        User researcher = getCurrentUser();
        // Exclude archived studies from the main dashboard
        return studyRepository.findByResearcherIdAndStatusNot(researcher.getId(), StudyStatus.ARCHIVED).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getStudiesByStatus(String status) {
        try {
            StudyStatus studyStatus = StudyStatus.valueOf(status.toUpperCase());
            User researcher = getCurrentUser();
            return studyRepository.findByResearcherIdAndStatus(researcher.getId(), studyStatus).stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid study status: " + status);
        }
    }
    
    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getActiveStudies() {
        LocalDate now = LocalDate.now();
        return studyRepository.findByStatus(StudyStatus.ACTIVE).stream()
                .filter(study -> !study.getStartDate().isAfter(now))
                .filter(study -> study.getEndDate() == null || !study.getEndDate().isBefore(now))
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteStudy(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Only admins can permanently delete studies, or researchers can delete their own draft studies
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        boolean isDraft = study.getStatus() == StudyStatus.DRAFT;
        
        if (!isAdmin && !(isOwner && isDraft)) {
            throw new IllegalStateException("Only admins can permanently delete studies. Researchers can only delete their own draft studies.");
        }
        
        // Cascade delete all related data
        // 1. Delete evaluation criteria
        evaluationCriterionRepository.deleteByStudy(study);
        
        // 2. Delete study artifacts (just the associations, not the actual artifact files)
        studyArtifactRepository.deleteByStudy(study);
        
        // 3. Delete the study itself (any other related data will be cascade deleted by JPA)
        studyRepository.delete(study);
    }
    
    @Transactional(readOnly = true)
    public List<StudyEnrollmentDTO> getMyAssignedStudies() {
        User participant = getCurrentUser();
        return enrollmentRepository.findByParticipantId(participant.getId()).stream()
                .filter(e -> e.getStatus() != StudyEnrollment.EnrollmentStatus.DECLINED &&
                             e.getStatus() != StudyEnrollment.EnrollmentStatus.INVITED)
                .map(this::convertToEnrollmentDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<StudyEnrollmentDTO> getMyCompletedStudies() {
        User participant = getCurrentUser();
        return enrollmentRepository.findByParticipantIdAndStatus(participant.getId(), StudyEnrollment.EnrollmentStatus.COMPLETED).stream()
                .map(this::convertToEnrollmentDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public StudyResponseDTO publishStudy(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Check if user is the owner of the study
        if (!study.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only publish your own studies");
        }
        
        // Only draft studies can be published
        if (study.getStatus() != StudyStatus.DRAFT) {
            throw new IllegalStateException("Only draft studies can be published");
        }
        
        // Check if start date has not yet arrived
        if (study.getStartDate() != null && study.getStartDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException("Cannot publish study before its start date. The study will automatically activate on " + study.getStartDate());
        }
        
        study.setStatus(StudyStatus.ACTIVE);
        Study publishedStudy = studyRepository.save(study);
        return convertToResponseDTO(publishedStudy);
    }
    
    @Transactional
    public StudyResponseDTO archiveStudy(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        User currentUser = getCurrentUser();

        // Check if user is the owner of the study
        if (!study.getResearcher().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only archive your own studies");
        }

        // Only completed studies can be archived
        if (study.getStatus() != StudyStatus.COMPLETED) {
            throw new IllegalStateException("Only completed studies can be archived. Current status: " + study.getStatus().name());
        }

        study.setStatus(StudyStatus.ARCHIVED);
        Study archivedStudy = studyRepository.save(study);
        return convertToResponseDTO(archivedStudy);
    }

    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getArchivedStudies() {
        User researcher = getCurrentUser();
        return studyRepository.findByResearcherIdAndStatus(researcher.getId(), StudyStatus.ARCHIVED).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getActiveStudiesExcludingArchived() {
        User researcher = getCurrentUser();
        return studyRepository.findByResearcherIdAndStatusNot(researcher.getId(), StudyStatus.ARCHIVED).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    private StudyResponseDTO convertToResponseDTO(Study study) {
        StudyResponseDTO dto = new StudyResponseDTO();
        dto.setId(study.getId());
        dto.setTitle(study.getTitle());
        dto.setDescription(study.getDescription());
        dto.setObjective(study.getObjective());
        dto.setStartDate(study.getStartDate());
        dto.setEndDate(study.getEndDate());
        dto.setStatus(study.getStatus().name());
        dto.setResearcherId(study.getResearcher().getId());
        dto.setResearcherName(study.getResearcher().getFullName());
        dto.setCreatedAt(study.getCreatedAt());
        dto.setUpdatedAt(study.getUpdatedAt());
        dto.setComparisonType(study.getComparisonType());
        dto.setBlindedMode(study.getBlindedMode());
        dto.setMaxParticipants(study.getMaxParticipants());
        
        // Fetch and include custom evaluation criteria
        List<EvaluationCriterion> customCriteria = evaluationCriterionRepository.findByStudyOrderByDisplayOrderAsc(study);
        if (!customCriteria.isEmpty()) {
            List<EvaluationCriterionDTO> criteriaList = customCriteria.stream()
                    .map(criterion -> {
                        EvaluationCriterionDTO criterionDTO = new EvaluationCriterionDTO();
                        criterionDTO.setId(criterion.getId());
                        criterionDTO.setName(criterion.getName());
                        criterionDTO.setDescription(criterion.getDescription());
                        criterionDTO.setRatingFormat(criterion.getRatingFormat().name());
                        criterionDTO.setRatingOptions(criterion.getRatingOptions());
                        criterionDTO.setDisplayOrder(criterion.getDisplayOrder());
                        return criterionDTO;
                    })
                    .collect(Collectors.toList());
            dto.setCustomCriteria(criteriaList);
        }
        
        // Fetch and include study artifacts
        List<StudyArtifact> studyArtifacts = studyArtifactRepository.findByStudyOrderByDisplayOrderAsc(study);
        if (!studyArtifacts.isEmpty()) {
            List<StudyArtifactDTO> artifactList = studyArtifacts.stream()
                    .map(studyArtifact -> {
                        StudyArtifactDTO artifactDTO = new StudyArtifactDTO();
                        artifactDTO.setArtifactId(studyArtifact.getArtifact().getId());
                        artifactDTO.setOriginalFilename(studyArtifact.getArtifact().getOriginalFilename());
                        artifactDTO.setContentType(studyArtifact.getArtifact().getContentType());
                        artifactDTO.setSizeBytes(studyArtifact.getArtifact().getSizeBytes());
                        artifactDTO.setDisplayLabel(studyArtifact.getDisplayLabel());
                        artifactDTO.setDisplayOrder(studyArtifact.getDisplayOrder());
                        return artifactDTO;
                    })
                    .collect(Collectors.toList());
            dto.setArtifacts(artifactList);
            dto.setArtifactCount(artifactList.size());
        }

        List<StudyQuiz> studyQuizzes = studyQuizRepository.findByStudyIdOrderByDisplayOrderAsc(study.getId());
        if (!studyQuizzes.isEmpty()) {
            List<StudyQuizDTO> quizDTOs = studyQuizzes.stream()
                    .map(this::convertToStudyQuizDTO)
                    .collect(Collectors.toList());
            dto.setQuizzes(quizDTOs);
        }
        
        // Calculate days remaining
        LocalDate now = LocalDate.now();
        if (study.getEndDate() != null) {
            long daysRemaining = ChronoUnit.DAYS.between(now, study.getEndDate());
            dto.setDaysRemaining(daysRemaining);
        }
        
        // Check if study is currently active
        boolean isActive = study.getStatus() == StudyStatus.ACTIVE &&
                          !study.getStartDate().isAfter(now) &&
                          (study.getEndDate() == null || !study.getEndDate().isBefore(now));
        dto.setIsActive(isActive);
        
        // Check if participants can participate (start date has passed, not ended)
        boolean canParticipate = !study.getStartDate().isAfter(now) &&
                                (study.getEndDate() == null || !study.getEndDate().isBefore(now)) &&
                                study.getStatus() == StudyStatus.ACTIVE;
        dto.setCanParticipate(canParticipate);
        
        return dto;
    }

    private StudyQuizDTO convertToStudyQuizDTO(StudyQuiz studyQuiz) {
        Questionnaire questionnaire = studyQuiz.getQuestionnaire();
        StudyQuizDTO dto = new StudyQuizDTO();
        dto.setId(studyQuiz.getId());
        dto.setStudyId(studyQuiz.getStudy().getId());
        dto.setQuestionnaireId(questionnaire.getId());
        dto.setQuestionnaireTitle(questionnaire.getTitle());
        dto.setQuestionnaireDescription(questionnaire.getDescription());
        dto.setQuestionnaireType(questionnaire.getType().name());
        dto.setQuestionnaireActive(questionnaire.getIsActive());
        dto.setQuestionCount(questionnaire.getQuestions() != null ? questionnaire.getQuestions().size() : null);
        dto.setTimeLimitMinutes(questionnaire.getTimeLimitMinutes());
        dto.setDisplayOrder(studyQuiz.getDisplayOrder());
        dto.setAttachedAt(studyQuiz.getCreatedAt());
        return dto;
    }
    
    @Transactional(readOnly = true)
    public List<StudyEnrollmentDTO> getStudyEnrollments(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Only researcher who owns the study or admin can view enrollments
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isOwner) {
            throw new IllegalStateException("Only the study owner or admin can view enrollments");
        }
        
        return enrollmentRepository.findByStudyId(studyId).stream()
                .map(this::convertToEnrollmentDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public StudyEnrollmentStatsDTO getStudyEnrollmentStats(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Only researcher who owns the study or admin can view stats
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isOwner) {
            throw new IllegalStateException("Only the study owner or admin can view enrollment stats");
        }
        
        List<StudyEnrollment> enrollments = enrollmentRepository.findByStudyId(studyId);
        
        StudyEnrollmentStatsDTO stats = new StudyEnrollmentStatsDTO();
        stats.setStudyId(studyId);
        stats.setStudyTitle(study.getTitle());
        // Total enrollments excluding DECLINED (only count active enrollments)
        long activeEnrollments = enrollments.stream()
                .filter(e -> e.getStatus() != StudyEnrollment.EnrollmentStatus.DECLINED)
                .count();
        stats.setTotalEnrollments((int) activeEnrollments);
        stats.setInvited((int) enrollments.stream().filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.INVITED).count());
        stats.setEnrolled((int) enrollments.stream().filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.ENROLLED).count());
        stats.setInProgress((int) enrollments.stream().filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS).count());
        stats.setCompleted((int) enrollments.stream().filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED).count());
        stats.setDropped((int) enrollments.stream().filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.DROPPED).count());
        
        if (study.getMaxParticipants() != null) {
            stats.setMaxParticipants(study.getMaxParticipants());
            // Calculate remaining slots excluding DECLINED, INVITED, DROPPED (only count active enrollments)
            long activeCount = enrollments.stream()
                    .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.ENROLLED ||
                                 e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS ||
                                 e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED)
                    .count();
            stats.setRemainingSlots((int) (study.getMaxParticipants() - activeCount));
        }
        
        return stats;
    }
    
    @Transactional
    public StudyEnrollmentDTO enrollParticipant(Long studyId, Long participantId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Only researcher who owns the study or admin can enroll participants
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isOwner) {
            throw new IllegalStateException("Only the study owner or admin can enroll participants");
        }
        
        // Check if participant exists and is a PARTICIPANT role
        User participant = userRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));
        
        if (participant.getRole() != User.Role.PARTICIPANT) {
            throw new IllegalArgumentException("User must have PARTICIPANT role to be enrolled");
        }
        
        // Check if participant is already invited or enrolled (DECLINED status allows re-invitation)
        Optional<StudyEnrollment> existingEnrollment = enrollmentRepository.findByStudyIdAndParticipantId(studyId, participantId);
        if (existingEnrollment.isPresent()) {
            StudyEnrollment.EnrollmentStatus existingStatus = existingEnrollment.get().getStatus();
            if (existingStatus == StudyEnrollment.EnrollmentStatus.INVITED) {
                throw new IllegalStateException("Participant has already been invited to this study");
            }
            if (existingStatus == StudyEnrollment.EnrollmentStatus.ENROLLED || 
                existingStatus == StudyEnrollment.EnrollmentStatus.IN_PROGRESS) {
                throw new IllegalStateException("Participant is already enrolled in this study");
            }
            // If DECLINED, update the existing enrollment to INVITED instead of creating new one
            if (existingStatus == StudyEnrollment.EnrollmentStatus.DECLINED) {
                StudyEnrollment enrollment = existingEnrollment.get();
                enrollment.setStatus(StudyEnrollment.EnrollmentStatus.INVITED);
                enrollment.setEnrolledAt(null); // Reset enrolled_at
                StudyEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
                return convertToEnrollmentDTO(savedEnrollment);
            }
        }
        
        // Check max participants limit (only count ENROLLED, IN_PROGRESS, COMPLETED)
        if (study.getMaxParticipants() != null) {
            long currentEnrollments = enrollmentRepository.findByStudyId(studyId).stream()
                    .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.ENROLLED ||
                                 e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS ||
                                 e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED)
                    .count();
            if (currentEnrollments >= study.getMaxParticipants()) {
                throw new IllegalStateException("Study has reached maximum participant limit");
            }
        }
        
        // Create enrollment with INVITED status (participant needs to accept)
        StudyEnrollment enrollment = new StudyEnrollment();
        enrollment.setStudy(study);
        enrollment.setParticipant(participant);
        enrollment.setStatus(StudyEnrollment.EnrollmentStatus.INVITED);
        
        StudyEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
        notificationService.createNotification(
            participant,
            currentUser,
            Notification.NotificationType.STUDY_INVITATION,
            "Study Invitation",
            "You have been invited to join the study: " + study.getTitle(),
            Notification.RelatedEntityType.STUDY,
            study.getId()
        );
        return convertToEnrollmentDTO(savedEnrollment);
    }
    
    @Transactional
    public void unenrollParticipant(Long studyId, Long enrollmentId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Only researcher who owns the study or admin can unenroll participants
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isOwner) {
            throw new IllegalStateException("Only the study owner or admin can unenroll participants");
        }
        
        // Find and delete enrollment
        StudyEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));
        
        // Verify enrollment belongs to the study
        if (!enrollment.getStudy().getId().equals(studyId)) {
            throw new IllegalArgumentException("Enrollment does not belong to this study");
        }
        
        enrollmentRepository.delete(enrollment);
    }
    
    @Transactional
    public StudyEnrollmentDTO updateEnrollmentStatus(Long studyId, Long enrollmentId, StudyEnrollment.EnrollmentStatus newStatus) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Only researcher who owns the study or admin can update enrollment status
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = study.getResearcher().getId().equals(currentUser.getId());
        
        if (!isAdmin && !isOwner) {
            throw new IllegalStateException("Only the study owner or admin can update enrollment status");
        }
        
        // Validate that only DROPPED or COMPLETED status can be set manually
        if (newStatus != StudyEnrollment.EnrollmentStatus.DROPPED && 
            newStatus != StudyEnrollment.EnrollmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Only DROPPED or COMPLETED status can be set manually");
        }
        
        // Find enrollment
        StudyEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));
        
        // Verify enrollment belongs to the study
        if (!enrollment.getStudy().getId().equals(studyId)) {
            throw new IllegalArgumentException("Enrollment does not belong to this study");
        }
        
        // Update status
        enrollment.setStatus(newStatus);
        
        // Set completedAt timestamp if status is COMPLETED
        if (newStatus == StudyEnrollment.EnrollmentStatus.COMPLETED && enrollment.getCompletedAt() == null) {
            enrollment.setCompletedAt(LocalDateTime.now());
        }
        
        StudyEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
        return convertToEnrollmentDTO(savedEnrollment);
    }
    
    @Transactional(readOnly = true)
    public List<User> getAvailableParticipants() {
        // Get all users with PARTICIPANT role
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == User.Role.PARTICIPANT && user.getActive())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ArtifactResponseDTO> getStudyArtifacts(Long studyId) {
        // Verify study exists
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Get all artifacts assigned to this study
        List<StudyArtifact> studyArtifacts = studyArtifactRepository.findByStudyIdOrderByDisplayOrderAsc(studyId);

        // Convert to DTOs
        return studyArtifacts.stream()
                .map(sa -> {
                    Artifact artifact = sa.getArtifact();
                    ArtifactResponseDTO dto = new ArtifactResponseDTO();
                    dto.setId(artifact.getId());
                    dto.setOriginalFilename(artifact.getOriginalFilename());
                    dto.setContentType(artifact.getContentType());
                    dto.setSizeBytes(artifact.getSizeBytes());
                    dto.setWidth(artifact.getWidth());
                    dto.setHeight(artifact.getHeight());
                    dto.setPageCount(artifact.getPageCount());
                    dto.setCreatedAt(artifact.getCreatedAt());
                    dto.setDisplayLabel(sa.getDisplayLabel());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    
    @Transactional(readOnly = true)
    public List<StudyEnrollmentDTO> getMyInvitations() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != User.Role.PARTICIPANT) {
            throw new IllegalStateException("Only participants can view their invitations");
        }
        
        return enrollmentRepository.findByParticipantIdAndStatus(
                currentUser.getId(), 
                StudyEnrollment.EnrollmentStatus.INVITED
        ).stream()
                .map(this::convertToEnrollmentDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public StudyEnrollmentDTO acceptEnrollment(Long enrollmentId) {
        StudyEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));
        
        User currentUser = getCurrentUser();
        
        // Only the participant can accept their own invitation
        if (!enrollment.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only accept your own invitations");
        }
        
        if (enrollment.getStatus() != StudyEnrollment.EnrollmentStatus.INVITED) {
            throw new IllegalStateException("Only invited enrollments can be accepted");
        }
        
        // Check max participants limit
        Study study = enrollment.getStudy();
        if (study.getMaxParticipants() != null) {
            long currentEnrollments = enrollmentRepository.findByStudyId(study.getId()).stream()
                    .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.ENROLLED ||
                                 e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS ||
                                 e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED)
                    .count();
            if (currentEnrollments >= study.getMaxParticipants()) {
                throw new IllegalStateException("Study has reached maximum participant limit");
            }
        }
        
        enrollment.setStatus(StudyEnrollment.EnrollmentStatus.ENROLLED);
        enrollment.setEnrolledAt(LocalDateTime.now());
        StudyEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
        
        return convertToEnrollmentDTO(savedEnrollment);
    }
    
    @Transactional
    public void declineEnrollment(Long enrollmentId) {
        StudyEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new IllegalArgumentException("Enrollment not found"));
        
        User currentUser = getCurrentUser();
        
        // Only the participant can decline their own invitation
        if (!enrollment.getParticipant().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("You can only decline your own invitations");
        }
        
        if (enrollment.getStatus() != StudyEnrollment.EnrollmentStatus.INVITED) {
            throw new IllegalStateException("Only invited enrollments can be declined");
        }
        
        // Set status to DECLINED instead of deleting
        enrollment.setStatus(StudyEnrollment.EnrollmentStatus.DECLINED);
        enrollmentRepository.save(enrollment);
    }
    
    private StudyEnrollmentDTO convertToEnrollmentDTO(StudyEnrollment enrollment) {
        StudyEnrollmentDTO dto = new StudyEnrollmentDTO();
        dto.setId(enrollment.getId());
        dto.setStudyId(enrollment.getStudy().getId());
        dto.setStudyTitle(enrollment.getStudy().getTitle());
        dto.setStudyDescription(enrollment.getStudy().getDescription());
        dto.setComparisonType(enrollment.getStudy().getComparisonType());
        dto.setStatus(enrollment.getStatus().name());
        dto.setEnrolledAt(enrollment.getEnrolledAt());
        dto.setCompletedAt(enrollment.getCompletedAt());
        dto.setStartDate(enrollment.getStudy().getStartDate());
        dto.setEndDate(enrollment.getStudy().getEndDate());
        dto.setStudyStatus(enrollment.getStudy().getStatus().name());

        // Add participant information
        dto.setParticipantId(enrollment.getParticipant().getId());
        dto.setParticipantName(enrollment.getParticipant().getFullName());
        dto.setParticipantEmail(enrollment.getParticipant().getEmail());
        dto.setParticipantUsername(enrollment.getParticipant().getUsername());

        // Calculate actual progress based on task completion
        int progress = 0;
        if (enrollment.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED) {
            progress = 100;
        } else {
            // Get all task assignments for this participant and filter by study
            List<ParticipantTaskAssignment> allAssignments = taskAssignmentRepository
                .findByParticipantId(enrollment.getParticipant().getId(), Pageable.unpaged())
                .getContent();
            
            // Filter assignments that belong to this study
            List<ParticipantTaskAssignment> studyAssignments = allAssignments.stream()
                .filter(a -> a.getEvaluationTask().getStudy() != null && 
                           a.getEvaluationTask().getStudy().getId().equals(enrollment.getStudy().getId()))
                .collect(Collectors.toList());
            
            if (!studyAssignments.isEmpty()) {
                long completedTasks = studyAssignments.stream()
                    .filter(a -> a.getStatus() == ParticipantTaskAssignment.AssignmentStatus.SUBMITTED ||
                               a.getStatus() == ParticipantTaskAssignment.AssignmentStatus.REVIEWED)
                    .count();
                progress = (int) ((completedTasks * 100.0) / studyAssignments.size());
            }
        }
        dto.setProgress(progress);

        // Calculate days remaining
        LocalDate now = LocalDate.now();
        if (enrollment.getStudy().getEndDate() != null) {
            long daysRemaining = ChronoUnit.DAYS.between(now, enrollment.getStudy().getEndDate());
            dto.setDaysRemaining(daysRemaining);
        }

        // Fetch latest completed quiz assignment using the repository method
        Optional<QuizAssignment> latestAssignment =
            quizAssignmentRepository
                .findTopByStudyIdAndParticipantIdAndStatusOrderByCompletedAtDesc(
                    enrollment.getStudy().getId(),
                    enrollment.getParticipant().getId(),
                    QuizAssignment.AssignmentStatus.COMPLETED
                );

        if (latestAssignment.isPresent() && Boolean.TRUE.equals(latestAssignment.get().getPassed())) {
            QuizAssignment assignment = latestAssignment.get();
            dto.setQuizCompleted(true);
            dto.setQuizPassed(true);
            dto.setQuizScore(assignment.getScore());
            dto.setQuizCompletedAt(assignment.getCompletedAt());
            dto.setQuizTitle(assignment.getQuestionnaire().getTitle());
            dto.setQuizAssignmentId(assignment.getId());
            
            // Set participant level - trust the persisted level from database
            ParticipantLevel level = assignment.getLevel();
            dto.setParticipantLevel(
                level != null ? level.name() : ParticipantLevel.BEGINNER.name()
            );
        } else if (latestAssignment.isPresent()) {
            // Quiz completed but not passed
            QuizAssignment assignment = latestAssignment.get();
            dto.setQuizCompleted(true);
            dto.setQuizPassed(false);
            dto.setQuizScore(assignment.getScore());
            dto.setQuizCompletedAt(assignment.getCompletedAt());
            dto.setQuizTitle(assignment.getQuestionnaire().getTitle());
            dto.setQuizAssignmentId(assignment.getId());
            dto.setParticipantLevel(null);
        } else {
            // No quiz completed
            dto.setQuizCompleted(false);
            dto.setQuizPassed(false);
            dto.setParticipantLevel(null);
        }

        return dto;
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));
    }
    
    /**
     * Get dashboard overview statistics for the current researcher
     */
    public DashboardOverviewDTO getDashboardOverview() {
        User researcher = getCurrentUser();
        
        if (!researcher.getRole().equals(User.Role.RESEARCHER)) {
            throw new IllegalStateException("Only researchers can access dashboard overview");
        }
        
        List<Study> myStudies = studyRepository.findByResearcherId(researcher.getId());
        
        // Calculate overall statistics
        int totalStudies = myStudies.size();
        int activeStudies = (int) myStudies.stream()
                .filter(s -> s.getStatus() == StudyStatus.ACTIVE)
                .count();
        int draftStudies = (int) myStudies.stream()
                .filter(s -> s.getStatus() == StudyStatus.DRAFT)
                .count();
        int completedStudies = (int) myStudies.stream()
                .filter(s -> s.getStatus() == StudyStatus.COMPLETED)
                .count();
        
        // Calculate participant and artifact statistics
        int totalParticipants = 0;
        int totalArtifacts = 0;
        double totalCompletionRate = 0;
        double totalRating = 0;
        int studiesWithRatings = 0;
        
        List<DashboardOverviewDTO.StudyStatDTO> studyStats = myStudies.stream()
                .map(study -> {
                    List<StudyEnrollment> enrollments = enrollmentRepository.findByStudyId(study.getId());
                    int participantCount = enrollments.size();
                    int completed = (int) enrollments.stream()
                            .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED)
                            .count();
                    
                    double completionPercentage = participantCount > 0 
                            ? (completed * 100.0 / participantCount) 
                            : 0.0;
                    
                    List<ParticipantEvaluationReview> reviews = 
                            evaluationReviewRepository.findByStudyIdOrderByCreatedAtDesc(study.getId());
                    
                    Double avgRating = reviews.stream()
                            .map(ParticipantEvaluationReview::getAverageRating)
                            .filter(r -> r != null)
                            .mapToDouble(Double::doubleValue)
                            .average()
                            .orElse(0.0);
                    
                    return DashboardOverviewDTO.StudyStatDTO.builder()
                            .studyId(study.getId())
                            .studyTitle(study.getTitle())
                            .status(study.getStatus().name())
                            .participantCount(participantCount)
                            .completedParticipants(completed)
                            .completionPercentage(Math.round(completionPercentage * 10) / 10.0)
                            .averageRating(Math.round(avgRating * 10) / 10.0)
                            .totalEvaluations(reviews.size())
                            .build();
                })
                .toList();
        
        // Aggregate totals
        for (DashboardOverviewDTO.StudyStatDTO stat : studyStats) {
            totalParticipants += stat.getParticipantCount();
            totalCompletionRate += stat.getCompletionPercentage();
            if (stat.getAverageRating() > 0) {
                totalRating += stat.getAverageRating();
                studiesWithRatings++;
            }
        }
        
        // Count artifacts
        for (Study study : myStudies) {
            totalArtifacts += studyArtifactRepository.findByStudyIdOrderByDisplayOrderAsc(study.getId()).size();
        }
        
        double averageCompletionRate = !studyStats.isEmpty() 
                ? Math.round((totalCompletionRate / studyStats.size()) * 10) / 10.0 
                : 0.0;
        
        double averageRating = studiesWithRatings > 0 
                ? Math.round((totalRating / studiesWithRatings) * 10) / 10.0 
                : 0.0;
        
        return DashboardOverviewDTO.builder()
                .totalStudies(totalStudies)
                .activeStudies(activeStudies)
                .draftStudies(draftStudies)
                .completedStudies(completedStudies)
                .totalParticipants(totalParticipants)
                .totalArtifacts(totalArtifacts)
                .averageCompletionRate(averageCompletionRate)
                .averageRating(averageRating)
                .studyStats(studyStats)
                .build();
    }

    @Transactional(readOnly = true)
    public ResearcherStatisticsDTO getResearcherStatistics() {
        User currentUser = getCurrentUser();
        DashboardOverviewDTO dashboard = getDashboardOverview();

        List<Study> myStudies = studyRepository.findByResearcherId(currentUser.getId());
        List<Long> studyIds = myStudies.stream()
                .map(Study::getId)
                .collect(Collectors.toList());

        List<StudyEnrollment> enrollments = studyIds.isEmpty()
                ? List.of()
                : enrollmentRepository.findByStudyIdIn(studyIds);

        EnumMap<StudyEnrollment.EnrollmentStatus, Long> enrollmentCounts = new EnumMap<>(StudyEnrollment.EnrollmentStatus.class);
        enrollments.forEach(enrollment ->
                enrollmentCounts.merge(enrollment.getStatus(), 1L, Long::sum)
        );

        ResearcherStatisticsDTO.ParticipantStats participantStats = ResearcherStatisticsDTO.ParticipantStats.builder()
                .invited(enrollmentCounts.getOrDefault(StudyEnrollment.EnrollmentStatus.INVITED, 0L).intValue())
                .enrolled(enrollmentCounts.getOrDefault(StudyEnrollment.EnrollmentStatus.ENROLLED, 0L).intValue())
                .inProgress(enrollmentCounts.getOrDefault(StudyEnrollment.EnrollmentStatus.IN_PROGRESS, 0L).intValue())
                .completed(enrollmentCounts.getOrDefault(StudyEnrollment.EnrollmentStatus.COMPLETED, 0L).intValue())
                .dropped(enrollmentCounts.getOrDefault(StudyEnrollment.EnrollmentStatus.DROPPED, 0L).intValue())
                .build();

        List<StudyArtifact> studyArtifacts = studyIds.isEmpty()
                ? List.of()
                : studyArtifactRepository.findByStudyIdIn(studyIds);

        Set<UUID> uniqueArtifactIds = new HashSet<>();
        Map<String, Long> artifactTypeCounts = new HashMap<>();
        Map<Long, Long> artifactsPerStudy = new HashMap<>();

        for (StudyArtifact studyArtifact : studyArtifacts) {
            if (studyArtifact.getArtifact() == null) {
                continue;
            }
            uniqueArtifactIds.add(studyArtifact.getArtifact().getId());
            if (studyArtifact.getStudy() != null) {
                artifactsPerStudy.merge(studyArtifact.getStudy().getId(), 1L, Long::sum);
            }
            String type = classifyContentType(studyArtifact.getArtifact().getContentType());
            artifactTypeCounts.merge(type, 1L, Long::sum);
        }

        List<ResearcherStatisticsDTO.CategoryValue> topArtifactTypes = artifactTypeCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> ResearcherStatisticsDTO.CategoryValue.builder()
                        .label(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        ResearcherStatisticsDTO.ArtifactStats artifactStats = ResearcherStatisticsDTO.ArtifactStats.builder()
                .totalStudyArtifacts(studyArtifacts.size())
                .uniqueArtifacts(uniqueArtifactIds.size())
                .topTypes(topArtifactTypes)
                .build();

        List<EvaluationTask> evaluationTasks = evaluationTaskRepository.findByCreatedById(currentUser.getId());
        Map<EvaluationTask.TaskStatus, Long> taskStatusCounts = new EnumMap<>(EvaluationTask.TaskStatus.class);
        Map<Long, Long> activeTasksPerStudy = new HashMap<>();

        for (EvaluationTask task : evaluationTasks) {
            taskStatusCounts.merge(task.getStatus(), 1L, Long::sum);
            if (task.getStudy() != null && task.getStatus() == EvaluationTask.TaskStatus.ACTIVE) {
                activeTasksPerStudy.merge(task.getStudy().getId(), 1L, Long::sum);
            }
        }

        List<ParticipantTaskAssignment> assignments =
                taskAssignmentRepository.findByEvaluationTaskCreatedById(currentUser.getId());
        Map<ParticipantTaskAssignment.AssignmentStatus, Long> assignmentStatusCounts =
                new EnumMap<>(ParticipantTaskAssignment.AssignmentStatus.class);
        assignments.forEach(assignment ->
                assignmentStatusCounts.merge(assignment.getStatus(), 1L, Long::sum)
        );

        int totalAssignments = assignments.size();
        int pendingAssignments = assignmentStatusCounts.getOrDefault(ParticipantTaskAssignment.AssignmentStatus.PENDING, 0L).intValue();
        int inProgressAssignments = assignmentStatusCounts.getOrDefault(ParticipantTaskAssignment.AssignmentStatus.IN_PROGRESS, 0L).intValue();
        int submittedAssignments = assignmentStatusCounts.getOrDefault(ParticipantTaskAssignment.AssignmentStatus.SUBMITTED, 0L).intValue();
        int reviewedAssignments = assignmentStatusCounts.getOrDefault(ParticipantTaskAssignment.AssignmentStatus.REVIEWED, 0L).intValue();
        double assignmentCompletionRate = totalAssignments > 0
                ? Math.round(((submittedAssignments + reviewedAssignments) * 1000.0 / totalAssignments)) / 10.0
                : 0.0;

        ResearcherStatisticsDTO.EvaluationStats evaluationStats = ResearcherStatisticsDTO.EvaluationStats.builder()
                .totalTasks(evaluationTasks.size())
                .activeTasks(taskStatusCounts.getOrDefault(EvaluationTask.TaskStatus.ACTIVE, 0L).intValue())
                .completedTasks(taskStatusCounts.getOrDefault(EvaluationTask.TaskStatus.COMPLETED, 0L).intValue())
                .draftTasks(taskStatusCounts.getOrDefault(EvaluationTask.TaskStatus.DRAFT, 0L).intValue())
                .totalAssignments(totalAssignments)
                .pendingAssignments(pendingAssignments)
                .inProgressAssignments(inProgressAssignments)
                .submittedAssignments(submittedAssignments)
                .reviewedAssignments(reviewedAssignments)
                .completionRate(assignmentCompletionRate)
                .build();

        List<ResearcherStatisticsDTO.StudyPerformanceDTO> topStudies = (dashboard != null && dashboard.getStudyStats() != null)
                ? dashboard.getStudyStats().stream()
                    .sorted(Comparator.comparingDouble(DashboardOverviewDTO.StudyStatDTO::getCompletionPercentage).reversed())
                    .limit(4)
                    .map(stat -> ResearcherStatisticsDTO.StudyPerformanceDTO.builder()
                            .studyId(stat.getStudyId())
                            .title(stat.getStudyTitle())
                            .status(stat.getStatus())
                            .participants(stat.getParticipantCount())
                            .completionRate(stat.getCompletionPercentage())
                            .averageRating(stat.getAverageRating())
                            .activeTasks(activeTasksPerStudy.getOrDefault(stat.getStudyId(), 0L).intValue())
                            .artifactCount(artifactsPerStudy.getOrDefault(stat.getStudyId(), 0L).intValue())
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        List<ResearcherStatisticsDTO.ActivityDTO> activityFeed = buildRecentActivityFeed(myStudies, evaluationTasks);

        return ResearcherStatisticsDTO.builder()
                .overview(buildOverviewStats(dashboard))
                .participantStats(participantStats)
                .artifactStats(artifactStats)
                .evaluationStats(evaluationStats)
                .topStudies(topStudies)
                .recentActivity(activityFeed)
                .build();
    }
    
    private ResearcherStatisticsDTO.OverviewStats buildOverviewStats(DashboardOverviewDTO dashboard) {
        if (dashboard == null) {
            return ResearcherStatisticsDTO.OverviewStats.builder().build();
        }
        return ResearcherStatisticsDTO.OverviewStats.builder()
                .totalStudies(dashboard.getTotalStudies())
                .activeStudies(dashboard.getActiveStudies())
                .draftStudies(dashboard.getDraftStudies())
                .completedStudies(dashboard.getCompletedStudies())
                .totalParticipants(dashboard.getTotalParticipants())
                .totalArtifacts(dashboard.getTotalArtifacts())
                .averageCompletionRate(dashboard.getAverageCompletionRate())
                .averageRating(dashboard.getAverageRating())
                .build();
    }

    private String classifyContentType(String contentType) {
        if (contentType == null) {
            return "Other";
        }
        String lowered = contentType.toLowerCase();
        if (lowered.startsWith("image/")) {
            return "Images";
        }
        if (lowered.contains("pdf") || lowered.contains("word") || lowered.contains("officedocument")) {
            return "Documents";
        }
        if (lowered.contains("json") || lowered.contains("yaml")) {
            return "Data";
        }
        if (lowered.contains("text") || lowered.contains("javascript") || lowered.contains("java") || lowered.contains("python")) {
            return "Code & Text";
        }
        if (lowered.contains("zip")) {
            return "Archives";
        }
        return "Other";
    }

    private List<ResearcherStatisticsDTO.ActivityDTO> buildRecentActivityFeed(List<Study> studies, List<EvaluationTask> tasks) {
        List<ResearcherStatisticsDTO.ActivityDTO> activities = new ArrayList<>();

        for (Study study : studies) {
            LocalDateTime timestamp = study.getUpdatedAt() != null ? study.getUpdatedAt() : study.getCreatedAt();
            activities.add(ResearcherStatisticsDTO.ActivityDTO.builder()
                    .type("Study")
                    .title(study.getTitle())
                    .description("Status: " + study.getStatus().name())
                    .timestamp(timestamp)
                    .build());
        }

        for (EvaluationTask task : tasks) {
            activities.add(ResearcherStatisticsDTO.ActivityDTO.builder()
                    .type("Evaluation Task")
                    .title(task.getTitle())
                    .description("Status: " + task.getStatus().name())
                    .timestamp(task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt())
                    .build());
        }

        return activities.stream()
                .filter(activity -> activity.getTimestamp() != null)
                .sorted(Comparator.comparing(ResearcherStatisticsDTO.ActivityDTO::getTimestamp).reversed())
                .limit(6)
                .collect(Collectors.toList());
    }

    /**
     * Get detailed statistics for a specific study
     */
    public StudyStatisticsDTO getStudyStatistics(Long studyId) {
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        
        User currentUser = getCurrentUser();
        
        // Check if user is the researcher or admin
        if (!study.getResearcher().getId().equals(currentUser.getId()) 
                && !currentUser.getRole().equals(User.Role.ADMIN)) {
            throw new IllegalStateException("Not authorized to view this study's statistics");
        }
        
        List<StudyEnrollment> enrollments = enrollmentRepository.findByStudyId(studyId);
        
        int totalEnrolled = enrollments.size();
        int activeParticipants = (int) enrollments.stream()
                .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS)
                .count();
        int completedParticipants = (int) enrollments.stream()
                .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED)
                .count();
        int droppedParticipants = (int) enrollments.stream()
                .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.DROPPED)
                .count();
        
        double completionRate = totalEnrolled > 0 
                ? Math.round((completedParticipants * 100.0 / totalEnrolled) * 10) / 10.0 
                : 0.0;
        
        List<ParticipantEvaluationReview> reviews = 
                evaluationReviewRepository.findByStudyIdOrderByCreatedAtDesc(studyId);
        
        int totalEvaluations = reviews.size();
        int completedEvaluations = (int) reviews.stream()
                .filter(r -> r.getReviewedAt() != null)
                .count();
        int pendingEvaluations = totalEvaluations - completedEvaluations;
        
        int acceptedReviews = (int) reviews.stream()
                .filter(r -> r.getDecision() == ParticipantEvaluationReview.ReviewDecision.ACCEPTED)
                .count();
        int rejectedReviews = (int) reviews.stream()
                .filter(r -> r.getDecision() == ParticipantEvaluationReview.ReviewDecision.REJECTED)
                .count();
        int flaggedReviews = (int) reviews.stream()
                .filter(r -> r.getDecision() == ParticipantEvaluationReview.ReviewDecision.FLAGGED)
                .count();
        int pendingReviews = (int) reviews.stream()
                .filter(r -> r.getDecision() == ParticipantEvaluationReview.ReviewDecision.PENDING)
                .count();
        
        Double avgQuality = reviews.stream()
                .map(ParticipantEvaluationReview::getQualityRating)
                .filter(r -> r != null)
                .mapToDouble(Integer::doubleValue)
                .average()
                .orElse(0.0);
        
        Double avgConsistency = reviews.stream()
                .map(ParticipantEvaluationReview::getConsistencyRating)
                .filter(r -> r != null)
                .mapToDouble(Integer::doubleValue)
                .average()
                .orElse(0.0);
        
        Double avgCompleteness = reviews.stream()
                .map(ParticipantEvaluationReview::getCompletenessRating)
                .filter(r -> r != null)
                .mapToDouble(Integer::doubleValue)
                .average()
                .orElse(0.0);
        
        Double overallAvg = reviews.stream()
                .map(ParticipantEvaluationReview::getAverageRating)
                .filter(r -> r != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        
        Integer avgTime = (int) reviews.stream()
                .map(ParticipantEvaluationReview::getEvaluationTimeMinutes)
                .filter(t -> t != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        
        LocalDateTime lastActivity = reviews.stream()
                .map(ParticipantEvaluationReview::getReviewedAt)
                .filter(d -> d != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        
        return StudyStatisticsDTO.builder()
                .studyId(study.getId())
                .studyTitle(study.getTitle())
                .status(study.getStatus().name())
                .totalEnrolled(totalEnrolled)
                .activeParticipants(activeParticipants)
                .completedParticipants(completedParticipants)
                .droppedParticipants(droppedParticipants)
                .completionRate(completionRate)
                .totalEvaluations(totalEvaluations)
                .completedEvaluations(completedEvaluations)
                .pendingEvaluations(pendingEvaluations)
                .averageQualityRating(Math.round(avgQuality * 10) / 10.0)
                .averageConsistencyRating(Math.round(avgConsistency * 10) / 10.0)
                .averageCompletenessRating(Math.round(avgCompleteness * 10) / 10.0)
                .overallAverageRating(Math.round(overallAvg * 10) / 10.0)
                .acceptedReviews(acceptedReviews)
                .rejectedReviews(rejectedReviews)
                .flaggedReviews(flaggedReviews)
                .pendingReviews(pendingReviews)
                .averageEvaluationTimeMinutes(avgTime)
                .lastActivityAt(lastActivity)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ParticipantHistoryDTO> getParticipantHistory() {
        User participant = getCurrentUser();
        
        // Get all enrollments for this participant (not just completed)
        List<StudyEnrollment> enrollments = enrollmentRepository.findByParticipantId(participant.getId());
        
        // Get all evaluation submissions by this participant
        List<EvaluationSubmission> evaluationSubmissions = evaluationSubmissionRepository
                .findByAssignmentParticipantId(participant.getId());
        
        // Get all quiz submissions by this participant
        List<QuizSubmission> quizSubmissions = quizSubmissionRepository
                .findByParticipantIdOrderByStartedAtDesc(participant.getId());
        
        // Group submissions by study
        Map<Long, List<EvaluationSubmission>> evalsByStudy = evaluationSubmissions.stream()
                .collect(Collectors.groupingBy(s -> s.getAssignment().getEvaluationTask().getStudy().getId()));
        
        Map<Long, List<QuizSubmission>> quizzesByStudy = quizSubmissions.stream()
                .filter(s -> s.getQuizAssignment() != null && s.getQuizAssignment().getStudy() != null)
                .collect(Collectors.groupingBy(s -> s.getQuizAssignment().getStudy().getId()));
        
        // Build history for each study
        List<ParticipantHistoryDTO> history = new ArrayList<>();
        
        for (StudyEnrollment enrollment : enrollments) {
            Study study = enrollment.getStudy();
            Long studyId = study.getId();
            
            List<ParticipantHistoryDTO.CompletedTaskDTO> completedTasks = new ArrayList<>();
            
            // Add evaluation tasks
            List<EvaluationSubmission> studyEvals = evalsByStudy.getOrDefault(studyId, List.of());
            for (EvaluationSubmission submission : studyEvals) {
                if (submission.getSubmittedAt() != null) {
                    completedTasks.add(ParticipantHistoryDTO.CompletedTaskDTO.builder()
                            .taskId(submission.getAssignment().getEvaluationTask().getId())
                            .taskType("EVALUATION")
                            .taskTitle(submission.getAssignment().getEvaluationTask().getTitle())
                            .completedAt(submission.getSubmittedAt())
                            .score(null) // EvaluationSubmission doesn't have a simple totalScore field
                            .status(submission.getReviewerStatus() != null ? submission.getReviewerStatus().name() : "SUBMITTED")
                            .build());
                }
            }
            
            // Add quiz tasks
            List<QuizSubmission> studyQuizzes = quizzesByStudy.getOrDefault(studyId, List.of());
            for (QuizSubmission submission : studyQuizzes) {
                if (submission.getSubmittedAt() != null) {
                    String quizTitle = submission.getQuestionnaire() != null 
                            ? submission.getQuestionnaire().getTitle() 
                            : "Quiz";
                    completedTasks.add(ParticipantHistoryDTO.CompletedTaskDTO.builder()
                            .taskId(submission.getId())
                            .taskType("QUIZ")
                            .taskTitle(quizTitle)
                            .completedAt(submission.getSubmittedAt())
                            .score(submission.getFinalScore() != null ? submission.getFinalScore().intValue() : null)
                            .status(submission.getStatus() != null ? submission.getStatus().name() : "UNKNOWN")
                            .build());
                }
            }
            
            // Sort tasks by completion date
            completedTasks.sort(Comparator.comparing(ParticipantHistoryDTO.CompletedTaskDTO::getCompletedAt,
                    Comparator.nullsLast(Comparator.naturalOrder())).reversed());
            
            int totalEvals = (int) completedTasks.stream().filter(t -> "EVALUATION".equals(t.getTaskType())).count();
            int totalQuizzes = (int) completedTasks.stream().filter(t -> "QUIZ".equals(t.getTaskType())).count();
            
            // Calculate progress based on completed tasks vs total available tasks
            int totalAvailableTasks = studyEvals.size() + studyQuizzes.size();
            int progress = totalAvailableTasks > 0 ? (completedTasks.size() * 100 / totalAvailableTasks) : 0;
            
            history.add(ParticipantHistoryDTO.builder()
                    .studyId(studyId)
                    .studyTitle(study.getTitle())
                    .studyDescription(study.getDescription())
                    .enrolledAt(enrollment.getEnrolledAt())
                    .completedAt(enrollment.getCompletedAt())
                    .enrollmentStatus(enrollment.getStatus().name())
                    .progress(progress)
                    .completedTasks(completedTasks)
                    .totalTasksCompleted(completedTasks.size())
                    .totalEvaluationsCompleted(totalEvals)
                    .totalQuizzesCompleted(totalQuizzes)
                    .build());
        }
        
        // Sort by most recent activity
        history.sort((a, b) -> {
            LocalDateTime aTime = a.getCompletedAt() != null ? a.getCompletedAt() : a.getEnrolledAt();
            LocalDateTime bTime = b.getCompletedAt() != null ? b.getCompletedAt() : b.getEnrolledAt();
            if (aTime == null && bTime == null) return 0;
            if (aTime == null) return 1;
            if (bTime == null) return -1;
            return bTime.compareTo(aTime);
        });
        
        return history;
    }
}

