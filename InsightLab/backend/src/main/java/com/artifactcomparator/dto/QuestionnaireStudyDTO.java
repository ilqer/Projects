package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionnaireStudyDTO {
    private Long studyQuizId;
    private Long studyId;
    private String studyTitle;
    private String studyStatus;
}
