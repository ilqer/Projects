package com.artifactcomparator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerateArtifactRequestDTO {
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Programming language is required")
    private String programmingLanguage;
    
    @NotBlank(message = "Complexity is required")
    private String complexity;
    
    @NotNull(message = "Include comments flag is required")
    private Boolean includeComments;
    
    @NotNull(message = "Follow best practices flag is required")
    private Boolean followBestPractices;
    
    @NotNull(message = "Add error handling flag is required")
    private Boolean addErrorHandling;
}
