package com.artifactcomparator.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AIArtifactDraftDTO {
    private Long id;
    private Long jobId;
    private Long researcherId;
    private String name;
    private String content;
    private String programmingLanguage;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
