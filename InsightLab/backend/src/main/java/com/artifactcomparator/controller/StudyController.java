package com.artifactcomparator.controller;

import com.artifactcomparator.dto.EnrollParticipantRequest;
import com.artifactcomparator.dto.ErrorResponse;
import com.artifactcomparator.dto.QuizAssignmentResponseDTO;
import com.artifactcomparator.dto.StudyCreateDTO;
import com.artifactcomparator.dto.StudyEnrollmentDTO;
import com.artifactcomparator.dto.StudyEnrollmentStatsDTO;
import com.artifactcomparator.dto.StudyQuizAssignmentRequest;
import com.artifactcomparator.dto.StudyQuizAttachRequest;
import com.artifactcomparator.dto.StudyQuizDTO;
import com.artifactcomparator.dto.StudyResponseDTO;
import com.artifactcomparator.dto.StudyUpdateDTO;
import com.artifactcomparator.dto.UpdateEnrollmentStatusRequest;
import com.artifactcomparator.model.StudyEnrollment;
import com.artifactcomparator.model.User;
import com.artifactcomparator.service.StudyQuizService;
import com.artifactcomparator.service.StudyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/studies")
@RequiredArgsConstructor
public class StudyController {
    
    private final StudyService studyService;
    private final StudyQuizService studyQuizService;
    
    @PostMapping
    public ResponseEntity<StudyResponseDTO> createStudy(@Valid @RequestBody StudyCreateDTO studyCreateDTO) {
        try {
            StudyResponseDTO createdStudy = studyService.createStudy(studyCreateDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdStudy);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PutMapping("/{studyId}")
    public ResponseEntity<StudyResponseDTO> updateStudy(
            @PathVariable Long studyId,
            @Valid @RequestBody StudyUpdateDTO studyUpdateDTO) {
        try {
            StudyResponseDTO updatedStudy = studyService.updateStudy(studyId, studyUpdateDTO);
            return ResponseEntity.ok(updatedStudy);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @GetMapping("/{studyId}")
    public ResponseEntity<StudyResponseDTO> getStudyById(@PathVariable Long studyId) {
        try {
            StudyResponseDTO study = studyService.getStudyById(studyId);
            return ResponseEntity.ok(study);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping
    public ResponseEntity<List<StudyResponseDTO>> getAllStudies() {
        List<StudyResponseDTO> studies = studyService.getAllStudies();
        return ResponseEntity.ok(studies);
    }
    
    @GetMapping("/my-studies")
    public ResponseEntity<List<StudyResponseDTO>> getMyStudies() {
        List<StudyResponseDTO> studies = studyService.getMyStudies();
        return ResponseEntity.ok(studies);
    }
    
    @GetMapping("/my-assigned-studies")
    public ResponseEntity<List<com.artifactcomparator.dto.StudyEnrollmentDTO>> getMyAssignedStudies() {
        List<com.artifactcomparator.dto.StudyEnrollmentDTO> studies = studyService.getMyAssignedStudies();
        return ResponseEntity.ok(studies);
    }
    
    @GetMapping("/my-completed-studies")
    public ResponseEntity<List<com.artifactcomparator.dto.StudyEnrollmentDTO>> getMyCompletedStudies() {
        List<com.artifactcomparator.dto.StudyEnrollmentDTO> studies = studyService.getMyCompletedStudies();
        return ResponseEntity.ok(studies);
    }
    
    @GetMapping("/participant-history")
    public ResponseEntity<List<com.artifactcomparator.dto.ParticipantHistoryDTO>> getParticipantHistory() {
        List<com.artifactcomparator.dto.ParticipantHistoryDTO> history = studyService.getParticipantHistory();
        return ResponseEntity.ok(history);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<StudyResponseDTO>> getStudiesByStatus(@PathVariable String status) {
        try {
            List<StudyResponseDTO> studies = studyService.getStudiesByStatus(status);
            return ResponseEntity.ok(studies);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<StudyResponseDTO>> getActiveStudies() {
        List<StudyResponseDTO> studies = studyService.getActiveStudies();
        return ResponseEntity.ok(studies);
    }
    
    @DeleteMapping("/{studyId}")
    public ResponseEntity<Void> deleteStudy(@PathVariable Long studyId) {
        try {
            studyService.deleteStudy(studyId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PostMapping("/{studyId}/publish")
    public ResponseEntity<StudyResponseDTO> publishStudy(@PathVariable Long studyId) {
        try {
            StudyResponseDTO publishedStudy = studyService.publishStudy(studyId);
            return ResponseEntity.ok(publishedStudy);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{studyId}/archive")
    public ResponseEntity<?> archiveStudy(@PathVariable Long studyId) {
        try {
            StudyResponseDTO archivedStudy = studyService.archiveStudy(studyId);
            return ResponseEntity.ok(archivedStudy);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/archived")
    public ResponseEntity<List<StudyResponseDTO>> getArchivedStudies() {
        List<StudyResponseDTO> studies = studyService.getArchivedStudies();
        return ResponseEntity.ok(studies);
    }

    @GetMapping("/active-studies")
    public ResponseEntity<List<StudyResponseDTO>> getActiveStudiesExcludingArchived() {
        List<StudyResponseDTO> studies = studyService.getActiveStudiesExcludingArchived();
        return ResponseEntity.ok(studies);
    }

    @GetMapping("/{studyId}/artifacts")
    public ResponseEntity<List<com.artifactcomparator.dto.ArtifactResponseDTO>> getStudyArtifacts(@PathVariable Long studyId) {
        try {
            List<com.artifactcomparator.dto.ArtifactResponseDTO> artifacts = studyService.getStudyArtifacts(studyId);
            return ResponseEntity.ok(artifacts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{studyId}/quizzes")
    public ResponseEntity<StudyQuizDTO> attachQuizToStudy(
            @PathVariable Long studyId,
            @Valid @RequestBody StudyQuizAttachRequest request) {
        try {
            StudyQuizDTO dto = studyQuizService.attachQuiz(studyId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/{studyId}/quizzes")
    public ResponseEntity<List<StudyQuizDTO>> getStudyQuizzes(@PathVariable Long studyId) {
        try {
            List<StudyQuizDTO> quizzes = studyQuizService.getStudyQuizzes(studyId);
            return ResponseEntity.ok(quizzes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{studyId}/quizzes/{studyQuizId}")
    public ResponseEntity<Void> removeStudyQuiz(
            @PathVariable Long studyId,
            @PathVariable Long studyQuizId) {
        try {
            studyQuizService.removeStudyQuiz(studyId, studyQuizId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{studyId}/quizzes/{studyQuizId}/assign")
    public ResponseEntity<QuizAssignmentResponseDTO> assignStudyQuiz(
            @PathVariable Long studyId,
            @PathVariable Long studyQuizId,
            @Valid @RequestBody StudyQuizAssignmentRequest request) {
        try {
            QuizAssignmentResponseDTO response = studyQuizService.assignStudyQuiz(studyId, studyQuizId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    @GetMapping("/{studyId}/quizzes/{studyQuizId}/assignments")
    public ResponseEntity<List<com.artifactcomparator.dto.QuizAssignmentDTO>> getStudyQuizAssignments(
            @PathVariable Long studyId,
            @PathVariable Long studyQuizId) {
        try {
            List<com.artifactcomparator.dto.QuizAssignmentDTO> assignments = 
                studyQuizService.getStudyQuizAssignments(studyId, studyQuizId);
            return ResponseEntity.ok(assignments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/dashboard/overview")
    public ResponseEntity<com.artifactcomparator.dto.DashboardOverviewDTO> getDashboardOverview() {
        try {
            com.artifactcomparator.dto.DashboardOverviewDTO overview = studyService.getDashboardOverview();
            return ResponseEntity.ok(overview);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/statistics/researcher")
    public ResponseEntity<com.artifactcomparator.dto.ResearcherStatisticsDTO> getResearcherStatistics() {
        try {
            com.artifactcomparator.dto.ResearcherStatisticsDTO statistics = studyService.getResearcherStatistics();
            return ResponseEntity.ok(statistics);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @GetMapping("/{studyId}/statistics")
    public ResponseEntity<com.artifactcomparator.dto.StudyStatisticsDTO> getStudyStatistics(@PathVariable Long studyId) {
        try {
            com.artifactcomparator.dto.StudyStatisticsDTO statistics = studyService.getStudyStatistics(studyId);
            return ResponseEntity.ok(statistics);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // Enrollment endpoints
    @GetMapping("/{studyId}/enrollments")
    public ResponseEntity<List<StudyEnrollmentDTO>> getStudyEnrollments(@PathVariable Long studyId) {
        try {
            List<StudyEnrollmentDTO> enrollments = studyService.getStudyEnrollments(studyId);
            return ResponseEntity.ok(enrollments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        }
    }

    @GetMapping("/{studyId}/enrollments/stats")
    public ResponseEntity<StudyEnrollmentStatsDTO> getStudyEnrollmentStats(@PathVariable Long studyId) {
        try {
            StudyEnrollmentStatsDTO stats = studyService.getStudyEnrollmentStats(studyId);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        }
    }

    @PostMapping("/{studyId}/enrollments")
    public ResponseEntity<?> enrollParticipant(
            @PathVariable Long studyId,
            @RequestBody EnrollParticipantRequest request) {
        try {
            StudyEnrollmentDTO enrollment = studyService.enrollParticipant(studyId, request.getParticipantId());
            return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{studyId}/enrollments/{enrollmentId}")
    public ResponseEntity<?> unenrollParticipant(
            @PathVariable Long studyId,
            @PathVariable Long enrollmentId) {
        try {
            studyService.unenrollParticipant(studyId, enrollmentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{studyId}/enrollments/{enrollmentId}/status")
    public ResponseEntity<?> updateEnrollmentStatus(
            @PathVariable Long studyId,
            @PathVariable Long enrollmentId,
            @Valid @RequestBody UpdateEnrollmentStatusRequest request) {
        try {
            // Validate status string and convert to enum
            StudyEnrollment.EnrollmentStatus newStatus;
            try {
                newStatus = StudyEnrollment.EnrollmentStatus.valueOf(request.getStatus());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid status. Only DROPPED or COMPLETED are allowed."));
            }
            
            StudyEnrollmentDTO enrollment = studyService.updateEnrollmentStatus(studyId, enrollmentId, newStatus);
            return ResponseEntity.ok(enrollment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{studyId}/enrollments/available-participants")
    public ResponseEntity<List<User>> getAvailableParticipants(@PathVariable Long studyId) {
        try {
            List<User> participants = studyService.getAvailableParticipants();
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Participant invitation endpoints
    @GetMapping("/enrollments/my-invitations")
    public ResponseEntity<List<StudyEnrollmentDTO>> getMyInvitations() {
        try {
            List<StudyEnrollmentDTO> invitations = studyService.getMyInvitations();
            return ResponseEntity.ok(invitations);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/enrollments/{enrollmentId}/accept")
    public ResponseEntity<?> acceptEnrollment(@PathVariable Long enrollmentId) {
        try {
            StudyEnrollmentDTO enrollment = studyService.acceptEnrollment(enrollmentId);
            return ResponseEntity.ok(enrollment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/enrollments/{enrollmentId}/decline")
    public ResponseEntity<?> declineEnrollment(@PathVariable Long enrollmentId) {
        try {
            studyService.declineEnrollment(enrollmentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
}
