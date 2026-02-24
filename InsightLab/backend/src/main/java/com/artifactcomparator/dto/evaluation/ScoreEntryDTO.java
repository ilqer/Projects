package com.artifactcomparator.dto.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreEntryDTO {

    private Long id;
    private Long assignmentId;
    private Long criteriaItemId;
    private JsonNode value;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
