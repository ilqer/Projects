package com.artifactcomparator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiApiService {
    
    private static final Logger logger = LoggerFactory.getLogger(GeminiApiService.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
    private final ObjectMapper objectMapper;
    
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private WebClient.Builder webClientBuilder;
    
    private WebClient getWebClient() {
        if (webClientBuilder == null) {
            webClientBuilder = WebClient.builder();
        }
        return webClientBuilder.build();
    }
    
    public List<GeneratedQuestion> generateQuestions(String apiKey, String topic, String difficulty, int numberOfQuestions) {
        try {
            String prompt = buildPrompt(topic, difficulty, numberOfQuestions);
            
            WebClient webClient = getWebClient();
            
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            contents.put("parts", parts);
            requestBody.put("contents", List.of(contents));
            
            String response = webClient.post()
                    .uri(GEMINI_API_URL + "?key=" + apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            return parseResponse(response);
            
        } catch (Exception e) {
            logger.error("Error calling Gemini API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate questions: " + e.getMessage(), e);
        }
    }
    
    private String buildPrompt(String topic, String difficulty, int numberOfQuestions) {
        return String.format(
            "Generate %d quiz questions about '%s' with %s difficulty level. " +
            "Return the questions in JSON format with the following structure: " +
            "{\"questions\": [{\"questionText\": \"...\", \"type\": \"MULTIPLE_CHOICE\" or \"TRUE_FALSE\" or \"SHORT_ANSWER\", " +
            "\"options\": [{\"optionText\": \"...\", \"isCorrect\": true/false}], " +
            "\"correctAnswer\": \"...\", \"points\": 1}]}. " +
            "For MULTIPLE_CHOICE, provide 4 options with at least one correct. " +
            "For TRUE_FALSE, provide exactly 2 options (True, False) with one correct. " +
            "For SHORT_ANSWER, provide the correct answer in the correctAnswer field. " +
            "Make questions appropriate for %s difficulty. " +
            "Return ONLY valid JSON, no additional text.",
            numberOfQuestions, topic, difficulty, difficulty
        );
    }
    
    private List<GeneratedQuestion> parseResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty() || !candidates.has(0)) {
                throw new RuntimeException("No candidates in response");
            }
            
            JsonNode content = candidates.get(0).path("content");
            JsonNode parts = content.path("parts");
            if (parts.isEmpty() || !parts.has(0)) {
                throw new RuntimeException("No parts in response");
            }
            
            String text = parts.get(0).path("text").asText();
            
            // Clean the text - remove markdown code blocks if present
            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            
            JsonNode questionsNode = objectMapper.readTree(text).path("questions");
            
            List<GeneratedQuestion> questions = new ArrayList<>();
            for (JsonNode questionNode : questionsNode) {
                GeneratedQuestion question = new GeneratedQuestion();
                question.setQuestionText(questionNode.path("questionText").asText());
                
                String typeStr = questionNode.path("type").asText();
                question.setType(parseQuestionType(typeStr));
                
                question.setCorrectAnswer(questionNode.path("correctAnswer").asText(null));
                question.setPoints(questionNode.path("points").asInt(1));
                
                List<GeneratedOption> options = new ArrayList<>();
                JsonNode optionsNode = questionNode.path("options");
                for (JsonNode optionNode : optionsNode) {
                    GeneratedOption option = new GeneratedOption();
                    option.setOptionText(optionNode.path("optionText").asText());
                    option.setIsCorrect(optionNode.path("isCorrect").asBoolean(false));
                    options.add(option);
                }
                question.setOptions(options);
                
                questions.add(question);
            }
            
            return questions;
            
        } catch (Exception e) {
            logger.error("Error parsing Gemini response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }
    
    private com.artifactcomparator.model.Question.QuestionType parseQuestionType(String typeStr) {
        return switch (typeStr.toUpperCase()) {
            case "MULTIPLE_CHOICE" -> com.artifactcomparator.model.Question.QuestionType.MULTIPLE_CHOICE;
            case "TRUE_FALSE" -> com.artifactcomparator.model.Question.QuestionType.TRUE_FALSE;
            case "SHORT_ANSWER" -> com.artifactcomparator.model.Question.QuestionType.SHORT_ANSWER;
            default -> throw new IllegalArgumentException("Unknown question type: " + typeStr);
        };
    }
    
    // Inner classes for data transfer
    @lombok.Data
    public static class GeneratedQuestion {
        private String questionText;
        private com.artifactcomparator.model.Question.QuestionType type;
        private String correctAnswer;
        private Integer points = 1;
        private List<GeneratedOption> options = new ArrayList<>();
    }
    
    @lombok.Data
    public static class GeneratedOption {
        private String optionText;
        private Boolean isCorrect = false;
    }
    
    public String generateArtifact(String apiKey, String prompt) {
        try {
            WebClient webClient = getWebClient();
            
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            contents.put("parts", parts);
            requestBody.put("contents", List.of(contents));
            
            String response = webClient.post()
                    .uri(GEMINI_API_URL + "?key=" + apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            return parseArtifactResponse(response);
            
        } catch (Exception e) {
            logger.error("Error calling Gemini API for artifact generation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate artifact: " + e.getMessage(), e);
        }
    }
    
    private String parseArtifactResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty() || !candidates.has(0)) {
                throw new RuntimeException("No candidates in response");
            }
            
            JsonNode content = candidates.get(0).path("content");
            JsonNode parts = content.path("parts");
            if (parts.isEmpty() || !parts.has(0)) {
                throw new RuntimeException("No parts in response");
            }
            
            String text = parts.get(0).path("text").asText();
            
            // Clean the text - remove markdown code blocks if present
            text = text.replaceAll("```[a-z]*\\s*", "").replaceAll("```\\s*$", "").trim();
            
            return text;
            
        } catch (Exception e) {
            logger.error("Error parsing Gemini artifact response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }
    }
}


