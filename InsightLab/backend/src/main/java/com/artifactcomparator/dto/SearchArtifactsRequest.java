package com.artifactcomparator.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchArtifactsRequest {
    private String searchTerm;
    private List<Long> tagIds;
}
