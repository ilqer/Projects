package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyEnrollmentDTO {

    private Long id;
    private Long studyId;
    private String studyTitle;
    private String studyDescription;
    private String comparisonType;
    private String status;
    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;
    private LocalDate startDate;
    private LocalDate endDate;
    private String studyStatus;
    private Integer progress;
    private Long daysRemaining;

    // Participant information (for researcher view)
    private Long participantId;
    private String participantName;
    private String participantEmail;
    private String participantUsername;

    // Quiz progress
    private Boolean quizCompleted;
    private Boolean quizPassed;
    private Double quizScore;
    private LocalDateTime quizCompletedAt;
    private String quizTitle;
    private Long quizAssignmentId;
    private String participantLevel; // BEGINNER, INTERMEDIATE, ADVANCED or null
}
