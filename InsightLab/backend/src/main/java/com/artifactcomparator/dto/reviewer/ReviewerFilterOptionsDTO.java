package com.artifactcomparator.dto.reviewer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerFilterOptionsDTO {

    private List<Option> participants;
    private List<Option> tasks;
    private List<String> statuses;
    private List<String> taskTypes;
    private List<Integer> qualityScores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        private Long id;
        private String label;
    }
}
