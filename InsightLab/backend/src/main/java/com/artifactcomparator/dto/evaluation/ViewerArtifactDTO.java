package com.artifactcomparator.dto.evaluation;

import com.artifactcomparator.dto.TagDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViewerArtifactDTO {

    private UUID artifactId;
    private String displayName;
    private String url;
    private String mimeType;
    private Integer displayOrder;
    private List<TagDTO> tags;
}
