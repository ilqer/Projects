package com.artifactcomparator.dto.evaluation;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SubmissionExportResult {
    private byte[] data;
    private String fileName;
    private String contentType;
}
