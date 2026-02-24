package com.artifactcomparator.controller.evaluation;

import com.artifactcomparator.dto.evaluation.SubmissionReviewDetailDTO;
import com.artifactcomparator.dto.reviewer.*;
import com.artifactcomparator.service.evaluation.ImageStorageService;
import com.artifactcomparator.service.evaluation.ReviewerEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('REVIEWER')")
public class ReviewerEvaluationController {

    private final ReviewerEvaluationService reviewerEvaluationService;
    private final ImageStorageService imageStorageService;

    @GetMapping("/studies/{studyId}/evaluations/{assignmentId}")
    public ResponseEntity<SubmissionReviewDetailDTO> getEvaluationDetail(
        @PathVariable Long studyId,
        @PathVariable Long assignmentId,
        Authentication authentication
    ) {
        Long reviewerId = getCurrentUserId(authentication);
        SubmissionReviewDetailDTO detail = reviewerEvaluationService.getReviewerView(studyId, assignmentId, reviewerId);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/evaluations/assignments/{assignmentId}")
    public ResponseEntity<SubmissionReviewDetailDTO> getEvaluationDetailByAssignment(
        @PathVariable Long assignmentId,
        Authentication authentication
    ) {
        Long reviewerId = getCurrentUserId(authentication);
        SubmissionReviewDetailDTO detail = reviewerEvaluationService.getReviewerViewByAssignment(
            assignmentId,
            reviewerId
        );
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/studies/{studyId}/evaluations/{assignmentId}/decision")
    public ResponseEntity<ReviewerEvaluationDecisionResponse> saveReviewerDecision(
        @PathVariable Long studyId,
        @PathVariable Long assignmentId,
        @Valid @RequestBody ReviewerEvaluationDecisionRequest request,
        Authentication authentication
    ) {
        Long reviewerId = getCurrentUserId(authentication);
        ReviewerEvaluationDecisionResponse response = reviewerEvaluationService.saveReviewerDecision(
            studyId,
            assignmentId,
            request,
            reviewerId
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluations/assignments/{assignmentId}/decision")
    public ResponseEntity<ReviewerEvaluationDecisionResponse> saveReviewerDecisionByAssignment(
        @PathVariable Long assignmentId,
        @Valid @RequestBody ReviewerEvaluationDecisionRequest request,
        Authentication authentication
    ) {
        Long reviewerId = getCurrentUserId(authentication);
        ReviewerEvaluationDecisionResponse response = reviewerEvaluationService.saveReviewerDecisionByAssignment(
            assignmentId,
            request,
            reviewerId
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/studies/{studyId}/reviewer-dashboard")
    public ResponseEntity<ReviewerDashboardDTO> getReviewerDashboard(
        @PathVariable Long studyId,
        @RequestParam(value = "participantId", required = false) Long participantId,
        @RequestParam(value = "status", required = false) String status,
        @RequestParam(value = "taskId", required = false) Long taskId,
        @RequestParam(value = "taskType", required = false) String taskType,
        @RequestParam(value = "submittedFrom", required = false) String submittedFrom,
        @RequestParam(value = "submittedTo", required = false) String submittedTo,
        @RequestParam(value = "qualityScore", required = false) Integer qualityScore,
        @RequestParam(value = "minQualityScore", required = false) Integer minQualityScore,
        @RequestParam(value = "maxQualityScore", required = false) Integer maxQualityScore,
        @RequestParam(value = "minTimeSeconds", required = false) Integer minTimeSeconds,
        @RequestParam(value = "maxTimeSeconds", required = false) Integer maxTimeSeconds,
        @RequestParam(value = "fastThresholdSeconds", required = false) Integer fastThresholdSeconds,
        Authentication authentication
    ) {
        Long reviewerId = getCurrentUserId(authentication);
        ReviewerDashboardFilter filter = ReviewerDashboardFilter.builder()
            .participantId(participantId)
            .reviewerStatus(status != null ? status.toUpperCase(java.util.Locale.ROOT) : null)
            .taskId(taskId)
            .taskType(taskType)
            .submittedFrom(parseDateTime(submittedFrom))
            .submittedTo(parseDateTime(submittedTo))
            .qualityScore(qualityScore)
            .minQualityScore(minQualityScore)
            .maxQualityScore(maxQualityScore)
            .minTimeSeconds(minTimeSeconds)
            .maxTimeSeconds(maxTimeSeconds)
            .build();

        ReviewerDashboardDTO dashboard = reviewerEvaluationService.getDashboard(
            studyId,
            reviewerId,
            filter,
            fastThresholdSeconds
        );
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/studies/{studyId}/evaluate-comparison")
    public ResponseEntity<ReviewerComparisonDTO> getComparison(
        @PathVariable Long studyId,
        @RequestParam("taskId") Long taskId,
        Authentication authentication
    ) {
        Long reviewerId = getCurrentUserId(authentication);
        ReviewerComparisonDTO comparison = reviewerEvaluationService.getComparison(studyId, taskId, reviewerId);
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/evaluations/history")
    public ResponseEntity<List<ReviewerReviewHistoryDTO>> getReviewHistory(Authentication authentication) {
        Long reviewerId = getCurrentUserId(authentication);
        List<ReviewerReviewHistoryDTO> history = reviewerEvaluationService.getReviewHistory(reviewerId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<Resource> getEvaluationImage(@PathVariable String imageId) {
        try {
            UUID uuid = UUID.fromString(imageId);
            Resource resource = imageStorageService.loadImage(uuid);
            MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        if (authentication.getPrincipal() instanceof com.artifactcomparator.security.CustomUserDetailsService.CustomUserPrincipal principal) {
            return principal.getUser().getId();
        }
        throw new IllegalStateException("Invalid principal");
    }

    private LocalDateTime parseDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(raw);
    }
}
