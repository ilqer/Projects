package com.artifactcomparator.controller;

import com.artifactcomparator.dto.MessageResponse;
import com.artifactcomparator.dto.QuizAssignmentCreateDTO;
import com.artifactcomparator.dto.QuizAssignmentDTO;
import com.artifactcomparator.dto.QuizAssignmentResponseDTO;
import com.artifactcomparator.model.QuizAssignment;
import com.artifactcomparator.service.QuizAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz-assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class QuizAssignmentController {

    private final QuizAssignmentService quizAssignmentService;

    @PostMapping
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<QuizAssignmentResponseDTO> assignQuiz(@Valid @RequestBody QuizAssignmentCreateDTO dto) {
        QuizAssignmentResponseDTO response = quizAssignmentService.assignQuizToParticipants(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT')")
    public ResponseEntity<List<QuizAssignmentDTO>> getMyQuizAssignments() {
        return ResponseEntity.ok(quizAssignmentService.getMyQuizAssignments());
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT')")
    public ResponseEntity<List<QuizAssignmentDTO>> getAssignmentsByStatus(@PathVariable QuizAssignment.AssignmentStatus status) {
        return ResponseEntity.ok(quizAssignmentService.getAssignmentsByStatus(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'PARTICIPANT')")
    public ResponseEntity<QuizAssignmentDTO> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(quizAssignmentService.getAssignmentById(id));
    }

    @GetMapping("/questionnaire/{questionnaireId}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<QuizAssignmentDTO>> getAssignmentsByQuestionnaire(@PathVariable Long questionnaireId) {
        return ResponseEntity.ok(quizAssignmentService.getAssignmentsByQuestionnaire(questionnaireId));
    }

    @GetMapping("/study/{studyId}")
    @PreAuthorize("hasAnyRole('RESEARCHER', 'ADMIN')")
    public ResponseEntity<List<QuizAssignmentDTO>> getAssignmentsByStudy(@PathVariable Long studyId) {
        return ResponseEntity.ok(quizAssignmentService.getAssignmentsByStudy(studyId));
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuizAssignmentDTO> acceptAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(quizAssignmentService.acceptQuizAssignment(id));
    }

    @PutMapping("/{id}/decline")
    @PreAuthorize("hasRole('PARTICIPANT')")
    public ResponseEntity<QuizAssignmentDTO> declineAssignment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(quizAssignmentService.declineQuizAssignment(id, reason));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<MessageResponse> deleteAssignment(@PathVariable Long id) {
        quizAssignmentService.deleteAssignment(id);
        return ResponseEntity.ok(new MessageResponse("Quiz assignment deleted successfully"));
    }
}
