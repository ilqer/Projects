package com.artifactcomparator.dto;

import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtifactResponseDTO {

    private UUID id;
    private String originalFilename;
    private String contentType;
    private long sizeBytes;

    private Integer width;
    private Integer height;
    private Integer pageCount;
    private Instant createdAt;

    // Opsiyonel: duplicate bilgisi (hash'e göre hesaplanabilir)
    private Boolean duplicate;

    // UC2-5: artifact'in tag'leri
    private List<TagDTO> tags;

    // Display label when artifact is part of a study
    private String displayLabel;
}
