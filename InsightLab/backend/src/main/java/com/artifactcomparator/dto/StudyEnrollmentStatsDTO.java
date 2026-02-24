package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudyEnrollmentStatsDTO {
    private Long studyId;
    private String studyTitle;
    private Integer totalEnrollments;
    private Integer invited;
    private Integer enrolled;
    private Integer inProgress;
    private Integer completed;
    private Integer dropped;
    private Integer maxParticipants;
    private Integer remainingSlots;
}

