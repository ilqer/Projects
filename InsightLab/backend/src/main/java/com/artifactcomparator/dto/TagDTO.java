package com.artifactcomparator.dto;

import lombok.*;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagDTO {
    private Long id;
    private String name;
    private String color;
    private String description;
    private Long createdById;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer artifactCount;
}
