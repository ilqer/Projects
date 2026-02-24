package com.artifactcomparator.dto;

import com.artifactcomparator.model.AIQuestionGenerationJob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIQuestionGenerationJobDTO {
    
    private Long id;
    private Long researcherId;
    private String researcherName;
    private Long questionnaireId;
    private String questionnaireTitle;
    private String topic;
    private AIQuestionGenerationJob.DifficultyLevel difficulty;
    private Integer numberOfQuestions;
    private AIQuestionGenerationJob.JobStatus status;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
}

