package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyQuizDTO {

    private Long id;
    private Long studyId;
    private Long questionnaireId;
    private String questionnaireTitle;
    private String questionnaireDescription;
    private String questionnaireType;
    private Integer questionCount;
    private Integer timeLimitMinutes;
    private Integer displayOrder;
    private LocalDateTime attachedAt;
    private Boolean questionnaireActive;
}
