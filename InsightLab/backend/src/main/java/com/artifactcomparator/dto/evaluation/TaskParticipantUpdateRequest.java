package com.artifactcomparator.dto.evaluation;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskParticipantUpdateRequest {
    private List<Long> participantIds;
    private LocalDateTime dueDate;
}
