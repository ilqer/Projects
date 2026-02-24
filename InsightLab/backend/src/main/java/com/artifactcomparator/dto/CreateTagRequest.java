package com.artifactcomparator.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTagRequest {
    private String name;
    private String color;
    private String description;
}
