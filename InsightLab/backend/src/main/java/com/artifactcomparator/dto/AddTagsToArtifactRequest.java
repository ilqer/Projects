package com.artifactcomparator.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddTagsToArtifactRequest {
    private List<Long> tagIds;
}
