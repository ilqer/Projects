package com.artifactcomparator.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AIArtifactJobDTO {
    private Long id;
    private Long researcherId;
    private String description;
    private String programmingLanguage;
    private String complexity;
    private Boolean includeComments;
    private Boolean followBestPractices;
    private Boolean addErrorHandling;
    private String status;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
