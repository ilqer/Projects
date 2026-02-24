package com.artifactcomparator.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtifactAnalyticsResponse {

    private UUID artifactId;
    private String originalFilename;
    private String extension;
    private String contentType;
    private String detectedCategory;
    private long sizeBytes;
    private Instant uploadedAt;
    private List<MetricGroup> metricGroups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricGroup {
        private String key;
        private String title;
        private List<MetricEntry> metrics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricEntry {
        private String label;
        private String value;
        private String description;
    }
}
