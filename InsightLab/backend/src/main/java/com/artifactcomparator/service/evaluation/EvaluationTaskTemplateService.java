package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.dto.evaluation.template.EvaluationTaskTemplateDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EvaluationTaskTemplateService {

    private final ObjectMapper objectMapper;
    private final Map<String, EvaluationTaskTemplateDTO> templates = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadTemplates() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:templates/*.json");
            for (Resource resource : resources) {
                try {
                    JsonNode node = objectMapper.readTree(resource.getInputStream());
                    EvaluationTaskTemplateDTO template = objectMapper.convertValue(node, EvaluationTaskTemplateDTO.class);
                    if (template.getId() == null || template.getId().isBlank()) {
                        String filename = Objects.requireNonNull(resource.getFilename());
                        template.setId(filename.replace(".json", ""));
                    }
                    templates.put(template.getId(), template);
                } catch (IOException e) {
                    throw new IllegalStateException("Failed to parse template: " + resource.getFilename(), e);
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Unable to load evaluation task templates", e);
        }
    }

    public List<EvaluationTaskTemplateDTO> listTemplates() {
        return templates.values().stream()
            .sorted(Comparator.comparing(EvaluationTaskTemplateDTO::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
            .toList();
    }

    public EvaluationTaskTemplateDTO getTemplate(String id) {
        EvaluationTaskTemplateDTO template = templates.get(id);
        if (template == null) {
            throw new IllegalArgumentException("Template not found: " + id);
        }
        return template;
    }
}
