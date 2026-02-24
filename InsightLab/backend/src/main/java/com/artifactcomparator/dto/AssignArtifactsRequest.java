package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignArtifactsRequest {
    private List<UUID> artifactIds;
    private String displayLabel; // Optional label for all artifacts
}

