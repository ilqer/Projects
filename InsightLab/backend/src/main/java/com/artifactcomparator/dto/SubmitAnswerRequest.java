package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {
    @NotNull(message = "Submission ID is required")
    private Long submissionId;

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private String answerText; // For short answer and true/false questions

    private List<Long> selectedOptionIds; // For multiple choice questions
}
