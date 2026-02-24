package com.artifactcomparator.controller;

import com.artifactcomparator.dto.MessageResponse;
import com.artifactcomparator.dto.ReviewerAssignmentCreateDTO;
import com.artifactcomparator.dto.ReviewerAssignmentDTO;
import com.artifactcomparator.dto.ReviewerAssignmentResponseDTO;
import com.artifactcomparator.service.ReviewerAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviewer-assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReviewerAssignmentController {

    private final ReviewerAssignmentService assignmentService;

    /**
     * Researcher assigns reviewers to a study
     * POST /api/reviewer-assignments
     */
    @PostMapping
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<ReviewerAssignmentResponseDTO> assignReviewers(
            @Valid @RequestBody ReviewerAssignmentCreateDTO dto) {
        ReviewerAssignmentResponseDTO response = assignmentService.assignReviewersToStudy(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all my assignments (for reviewer)
     * GET /api/reviewer-assignments
     */
    @GetMapping
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<List<ReviewerAssignmentDTO>> getMyAssignments() {
        return ResponseEntity.ok(assignmentService.getMyAssignments());
    }

    /**
     * Get pending assignments (for reviewer)
     * GET /api/reviewer-assignments/pending
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<List<ReviewerAssignmentDTO>> getPendingAssignments() {
        return ResponseEntity.ok(assignmentService.getPendingAssignments());
    }

    /**
     * Get active assignments (accepted/in-progress) (for reviewer)
     * GET /api/reviewer-assignments/active
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<List<ReviewerAssignmentDTO>> getActiveAssignments() {
        return ResponseEntity.ok(assignmentService.getActiveAssignments());
    }

    /**
     * Get assignments for a study (for researcher)
     * GET /api/reviewer-assignments/study/{studyId}
     */
    @GetMapping("/study/{studyId}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<List<ReviewerAssignmentDTO>> getAssignmentsByStudy(@PathVariable Long studyId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByStudy(studyId));
    }

    /**
     * Accept assignment (for reviewer)
     * PUT /api/reviewer-assignments/{id}/accept
     */
    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<ReviewerAssignmentDTO> acceptAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.acceptAssignment(id));
    }

    /**
     * Decline assignment (for reviewer)
     * PUT /api/reviewer-assignments/{id}/decline
     */
    @PutMapping("/{id}/decline")
    @PreAuthorize("hasRole('REVIEWER')")
    public ResponseEntity<ReviewerAssignmentDTO> declineAssignment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(assignmentService.declineAssignment(id, reason));
    }

    /**
     * Delete assignment (for researcher)
     * DELETE /api/reviewer-assignments/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    public ResponseEntity<MessageResponse> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok(new MessageResponse("Reviewer assignment deleted successfully"));
    }
}