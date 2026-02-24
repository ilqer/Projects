package com.artifactcomparator.dto;

import com.artifactcomparator.model.ReviewerAssignment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerAssignmentDTO {

    private Long id;
    private Long studyId;
    private String studyTitle;
    private String studyDescription;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerEmail;
    private Long assignedById;
    private String assignedByName;
    private ReviewerAssignment.AssignmentStatus status;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime declinedAt;
    private LocalDateTime completedAt;
    private String declineReason;
    private String reviewerNotes;
    
    // Statistics
    private Integer totalEvaluations;
    private Integer reviewedEvaluations;
    private Integer acceptedEvaluations;
    private Integer rejectedEvaluations;
    private Integer flaggedEvaluations;
    private Integer progressPercentage;
    
    // Additional info
    private Integer totalParticipants;
    private Boolean canAccept;
    private Boolean canDecline;
    private Boolean canReview;
}