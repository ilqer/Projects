package com.artifactcomparator.service;

import com.artifactcomparator.dto.ArtifactAnalyticsResponse;
import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.ArtifactRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArtifactAnalysisService {

    private final ArtifactRepository artifactRepository;
    private final ArtifactService artifactService;

    @Value("${app.artifacts.storage-dir}")
    private String storageDir;

    private static final Set<String> CODE_EXTENSIONS = Set.of("java", "js", "ts", "py", "cpp", "c", "cs", "go");
    private static final Set<String> JSON_EXTENSIONS = Set.of("json", "yaml", "yml");
    private static final Set<String> TEXT_EXTENSIONS = Set.of("txt", "md", "log");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif");
    private static final Set<String> PDF_EXTENSIONS = Set.of("pdf");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    public ArtifactAnalyticsResponse analyzeArtifact(UUID artifactId, User requester) {
        // Re-use existing access checks
        artifactService.getArtifactById(artifactId, requester);

        Artifact artifact = artifactRepository.findById(artifactId)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        Path filePath = Path.of(storageDir).resolve(artifact.getStoredFilename());
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Artifact file is missing on disk");
        }

        String extension = extractExtension(artifact.getOriginalFilename());
        FileCategory category = detectCategory(extension);

        List<ArtifactAnalyticsResponse.MetricGroup> groups;
        try {
            switch (category) {
                case CODE -> groups = analyzeCode(filePath, extension);
                case JSON -> groups = analyzeJsonOrYaml(filePath, extension);
                case TEXT -> groups = analyzeText(filePath);
                case IMAGE -> groups = analyzeImage(filePath, artifact);
                case PDF -> groups = analyzePdf(filePath, artifact);
                default -> groups = analyzeBinary(filePath, artifact);
            }
        } catch (Exception ex) {
            log.error("Failed to analyze artifact {}: {}", artifactId, ex.getMessage(), ex);
            groups = List.of(
                    ArtifactAnalyticsResponse.MetricGroup.builder()
                            .key("analysisError")
                            .title("Analysis Error")
                            .metrics(List.of(
                                    ArtifactAnalyticsResponse.MetricEntry.builder()
                                            .label("Error")
                                            .value("Unable to analyze artifact content")
                                            .description(ex.getMessage())
                                            .build()
                            ))
                            .build()
            );
        }

        return ArtifactAnalyticsResponse.builder()
                .artifactId(artifactId)
                .originalFilename(artifact.getOriginalFilename())
                .extension(extension)
                .contentType(artifact.getContentType())
                .detectedCategory(category.name())
                .sizeBytes(artifact.getSizeBytes())
                .uploadedAt(Optional.ofNullable(artifact.getCreatedAt()).orElse(Instant.EPOCH))
                .metricGroups(groups)
                .build();
    }

    private List<ArtifactAnalyticsResponse.MetricGroup> analyzeCode(Path filePath, String extension) throws IOException {
        String content = Files.readString(filePath);
        String[] lines = content.split("\\R");
        int loc = lines.length;
        int sloc = (int) Arrays.stream(lines).filter(line -> !line.isBlank()).count();
        long commentLines = Arrays.stream(lines)
                .map(String::trim)
                .filter(line -> line.startsWith("//")
                        || line.startsWith("#")
                        || line.startsWith("/*")
                        || line.startsWith("*")
                        || line.startsWith("--"))
                .count();

        double commentRatio = loc == 0 ? 0d : (double) commentLines / loc;

        int functionCount = countRegex(content, "(?m)^\\s*(public|private|protected)?\\s*(static\\s+)?[\\w<>\\[\\]]+\\s+[a-zA-Z0-9_]+\\s*\\(")
                + countRegex(content, "\\bfunction\\s+[a-zA-Z0-9_]+\\s*\\(")
                + countRegex(content, "\\bdef\\s+[a-zA-Z0-9_]+\\s*\\(");
        int classCount = countRegex(content, "\\bclass\\s+[A-Z_a-z0-9]+");
        int importCount = countRegex(content, "\\b(import|using|#include)\\b");
        int nestingDepth = estimateNestingDepth(content);
        int cyclomatic = estimateCyclomaticComplexity(content);
        int cognitive = cyclomatic + Math.max(0, nestingDepth - 1);

        List<String> codeSmells = new ArrayList<>();
        if (sloc > 400) codeSmells.add("Very large file – consider splitting responsibilities.");
        if (nestingDepth > 4) codeSmells.add("Deep nesting may violate Single Responsibility.");
        if (commentRatio < 0.05) codeSmells.add("Sparse comments – document complex logic.");

        List<String> solidHints = new ArrayList<>();
        if (content.contains("switch") && content.contains("instanceof")) {
            solidHints.add("Possible Open/Closed violation – consider polymorphism.");
        }
        if (content.contains("new ") && content.contains("HttpClient")) {
            solidHints.add("Consider dependency inversion for external resources.");
        }

        List<String> securityWarnings = detectSecurityConcerns(content);

        List<String> couplingHints = new ArrayList<>();
        if (importCount > 20) couplingHints.add("High import count – check module boundaries.");
        if (classCount > 5 && functionCount / Math.max(1, classCount) > 10) {
            couplingHints.add("Classes contain many functions – review cohesion.");
        }

        return List.of(
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("structural")
                        .title("Structural Metrics")
                        .metrics(List.of(
                                metric("Lines of Code", loc, "Total number of physical lines"),
                                metric("Source Lines of Code", sloc, "Non-empty lines"),
                                metric("Comment Ratio", String.format("%.1f%%", commentRatio * 100), "Comment lines divided by total lines"),
                                metric("Function Count", functionCount, "Approximate number of functions/methods"),
                                metric("Class Count", classCount, "Number of class definitions"),
                                metric("Import Count", importCount, "Number of import/include statements")
                        ))
                        .build(),
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("complexity")
                        .title("Complexity Analysis")
                        .metrics(List.of(
                                metric("Cyclomatic Complexity", cyclomatic, "Estimated decision points + 1"),
                                metric("Cognitive Complexity", cognitive, "Cyclomatic complexity adjusted by nesting"),
                                metric("Max Nesting Depth", nestingDepth, "Maximum nested blocks detected")
                        ))
                        .build(),
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("design")
                        .title("Design & Code Smells")
                        .metrics(List.of(
                                metric("Code Smell Hints", codeSmells.isEmpty() ? "None detected" : String.join(", ", codeSmells), "Heuristic flags for maintainability"),
                                metric("SOLID Principle Hints", solidHints.isEmpty() ? "No immediate issues" : String.join(", ", solidHints), "Potential SOLID improvements"),
                                metric("Coupling/Cohesion", couplingHints.isEmpty() ? "Balanced" : String.join(", ", couplingHints), "High-level module health")
                        ))
                        .build(),
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("security")
                        .title("Security Review")
                        .metrics(List.of(
                                metric("Security Signals", securityWarnings.isEmpty() ? "No obvious risks" : String.join(", ", securityWarnings), "Static keyword scan for secret usage / risky APIs")
                        ))
                        .build()
        );
    }

    private List<ArtifactAnalyticsResponse.MetricGroup> analyzeJsonOrYaml(Path filePath, String extension) throws IOException {
        String raw = Files.readString(filePath);
        JsonNode node;
        boolean isValid = true;
        try {
            if ("yaml".equals(extension) || "yml".equals(extension)) {
                node = yamlMapper.readTree(raw);
            } else {
                node = objectMapper.readTree(raw);
            }
        } catch (JsonProcessingException ex) {
            isValid = false;
            node = null;
        }

        int keyCount = node == null ? 0 : countJsonKeys(node);
        int objectCount = node == null ? 0 : countJsonNodesOfType(node, JsonNode::isObject);
        int arrayCount = node == null ? 0 : countJsonNodesOfType(node, JsonNode::isArray);
        int depth = node == null ? 0 : measureJsonDepth(node, 0);

        return List.of(
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("jsonStructure")
                        .title("JSON/YAML Structure")
                        .metrics(List.of(
                                metric("Validation", isValid ? "Valid structure" : "Invalid – parsing failed", "Basic schema parsing result"),
                                metric("Key Count", keyCount, "Total keys across nested objects"),
                                metric("Object Count", objectCount, "Number of object nodes"),
                                metric("Array Count", arrayCount, "Number of array nodes"),
                                metric("Max Depth", depth, "Maximum nested depth detected")
                        ))
                        .build()
        );
    }

    private List<ArtifactAnalyticsResponse.MetricGroup> analyzeText(Path filePath) throws IOException {
        String content = Files.readString(filePath);
        String[] words = content.trim().isEmpty() ? new String[0] : content.trim().split("\\s+");
        int wordCount = words.length;
        String[] sentences = content.split("[.!?\\n]");
        int sentenceCount = (int) Arrays.stream(sentences).filter(s -> !s.trim().isEmpty()).count();
        double avgSentenceLength = sentenceCount == 0 ? 0d : (double) wordCount / sentenceCount;
        String language = detectLanguage(content);
        String repeatedWords = summarizeTopWords(words);

        return List.of(
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("textMetrics")
                        .title("Text Insights")
                        .metrics(List.of(
                                metric("Word Count", wordCount, "Total number of words"),
                                metric("Sentence Count", sentenceCount, "Approximate sentences"),
                                metric("Average Sentence Length", String.format("%.1f words", avgSentenceLength), "Word count divided by sentences"),
                                metric("Top Terms", repeatedWords.isBlank() ? "N/A" : repeatedWords, "Most frequent non-stop words"),
                                metric("Language Detection", language, "Heuristic based on character set")
                        ))
                        .build()
        );
    }

    private List<ArtifactAnalyticsResponse.MetricGroup> analyzeImage(Path filePath, Artifact artifact) throws IOException {
        BufferedImage image = ImageIO.read(filePath.toFile());
        if (image == null) {
            throw new IOException("Unsupported image format");
        }
        int width = image.getWidth();
        int height = image.getHeight();
        long fileSize = Files.size(filePath);
        String format = extractExtension(artifact.getOriginalFilename()).toUpperCase(Locale.ROOT);
        String histogramSummary = summarizeHistogram(image);

        return List.of(
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("imageMetrics")
                        .title("Image Metrics")
                        .metrics(List.of(
                                metric("Resolution", width + "×" + height + " px", "Image width × height"),
                                metric("Estimated DPI", "N/A", "DPI metadata not provided"),
                                metric("File Size", humanReadableBytes(fileSize), "On-disk size"),
                                metric("Format", format, "Detected via file extension"),
                                metric("Histogram Summary", histogramSummary, "Brightness distribution sample")
                        ))
                        .build()
        );
    }

    private List<ArtifactAnalyticsResponse.MetricGroup> analyzePdf(Path filePath, Artifact artifact) throws IOException {
        int pageCount;
        String extractedText;
        try (PDDocument document = PDDocument.load(filePath.toFile())) {
            pageCount = document.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            configurePdfStripper(stripper);
            extractedText = stripper.getText(document);
        }
        int wordCount = extractedText == null ? 0 : extractedText.trim().isEmpty() ? 0 : extractedText.trim().split("\\s+").length;
        return List.of(
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("pdfMetrics")
                        .title("PDF Insights")
                        .metrics(List.of(
                                metric("Page Count", pageCount, "Total number of pages"),
                                metric("Word Count", wordCount, "Approximate words extracted"),
                                metric("File Size", humanReadableBytes(artifact.getSizeBytes()), "Uploaded size")
                        ))
                        .build()
        );
    }

    private List<ArtifactAnalyticsResponse.MetricGroup> analyzeBinary(Path filePath, Artifact artifact) throws Exception {
        long size = Files.size(filePath);
        String mime = Optional.ofNullable(artifact.getContentType())
                .orElseGet(() -> {
                    try {
                        return Files.probeContentType(filePath);
                    } catch (IOException e) {
                        return "application/octet-stream";
                    }
                });
        String sha = artifact.getSha256() != null ? artifact.getSha256() : sha256Hex(filePath);

        return List.of(
                ArtifactAnalyticsResponse.MetricGroup.builder()
                        .key("binaryMetrics")
                        .title("Binary Artifact")
                        .metrics(List.of(
                                metric("File Size", humanReadableBytes(size), "Total bytes on disk"),
                                metric("MIME Type", mime != null ? mime : "unknown", "Best effort detection"),
                                metric("SHA-256", sha, "Integrity hash")
                        ))
                        .build()
        );
    }

    private ArtifactAnalyticsResponse.MetricEntry metric(String label, Object value, String description) {
        return ArtifactAnalyticsResponse.MetricEntry.builder()
                .label(label)
                .value(String.valueOf(value))
                .description(description)
                .build();
    }

    private int countRegex(String content, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(content);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private int estimateNestingDepth(String content) {
        int depth = 0;
        int max = 0;
        for (char c : content.toCharArray()) {
            if (c == '{' || c == '(' || c == '[') {
                depth++;
                max = Math.max(max, depth);
            } else if (c == '}' || c == ')' || c == ']') {
                depth = Math.max(0, depth - 1);
            }
        }
        return max;
    }

    private int estimateCyclomaticComplexity(String content) {
        String normalized = content.replace("\n", " ").toLowerCase(Locale.ROOT);
        String[] tokens = {" if ", " for ", " while ", " case ", " catch ", "&&", "||", "?", " else if "};
        int complexity = 1;
        for (String token : tokens) {
            complexity += countOccurrences(normalized, token);
        }
        return complexity;
    }

    private int countOccurrences(String source, String token) {
        int index = 0;
        int count = 0;
        while (index != -1) {
            index = source.indexOf(token, index);
            if (index != -1) {
                count++;
                index += token.length();
            }
        }
        return count;
    }

    private List<String> detectSecurityConcerns(String content) {
        List<String> warnings = new ArrayList<>();
        if (content.matches("(?s).*password\\s*=.*")) warnings.add("Potential hardcoded password.");
        if (content.matches("(?s).*secret\\s*=.*")) warnings.add("Secret token detected.");
        if (content.contains("eval(") || content.contains("exec(")) warnings.add("Dynamic code execution detected.");
        if (content.contains("System.exit")) warnings.add("System exit calls found – disrupts flow.");
        return warnings;
    }

    private String summarizeTopWords(String[] words) {
        if (words.length == 0) return "";
        Set<String> stopWords = Set.of("the", "and", "or", "to", "a", "of", "in", "is", "on", "for", "it", "with");
        Map<String, Integer> freq = new HashMap<>();
        for (String raw : words) {
            String word = raw.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
            if (word.isBlank() || stopWords.contains(word)) continue;
            freq.merge(word, 1, Integer::sum);
        }
        return freq.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> e.getKey() + " (" + e.getValue() + ")")
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }

    private String detectLanguage(String content) {
        if (content == null || content.isBlank()) return "Unknown";
        String lower = content.toLowerCase(Locale.ROOT);
        if (lower.matches(".*[\\u011f\\u00fc\\u015f\\u00f6\\u00e7\\u0131\\u0130].*")) {
            return "Likely Turkish";
        }
        if (lower.matches(".*[\\u00e9\\u00e8\\u00e0\\u00e7\\u00e2\\u00ea\\u00ee\\u00f4\\u00fb\\u00eb\\u00ef\\u00fc].*")) {
            return "Likely Western European";
        }
        return "Likely English";
    }

    private String summarizeHistogram(BufferedImage image) {
        long total = 0;
        long brightPixels = 0;
        long darkPixels = 0;
        int width = image.getWidth();
        int height = image.getHeight();
        int stepX = Math.max(1, width / 100);
        int stepY = Math.max(1, height / 100);
        for (int x = 0; x < width; x += stepX) {
            for (int y = 0; y < height; y += stepY) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                double luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (luminance > 200) brightPixels++;
                else if (luminance < 55) darkPixels++;
                total++;
            }
        }
        if (total == 0) return "No pixels processed";
        double brightRatio = (double) brightPixels / total;
        double darkRatio = (double) darkPixels / total;
        if (brightRatio > 0.5) return "Mostly bright";
        if (darkRatio > 0.5) return "Mostly dark";
        return "Balanced contrast";
    }

    private int countJsonKeys(JsonNode node) {
        if (node == null || node.isMissingNode()) return 0;
        int total = 0;
        if (node.isObject()) {
            total += node.size();
            Iterator<Map.Entry<String, JsonNode>> iter = node.fields();
            while (iter.hasNext()) {
                Map.Entry<String, JsonNode> entry = iter.next();
                total += countJsonKeys(entry.getValue());
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                total += countJsonKeys(child);
            }
        }
        return total;
    }

    private int countJsonNodesOfType(JsonNode node, java.util.function.Predicate<JsonNode> predicate) {
        if (node == null) return 0;
        int total = predicate.test(node) ? 1 : 0;
        if (node.isContainerNode()) {
            for (JsonNode child : node) {
                total += countJsonNodesOfType(child, predicate);
            }
        }
        return total;
    }

    private int measureJsonDepth(JsonNode node, int depth) {
        if (node == null || node.isValueNode()) return depth;
        int max = depth;
        if (node.isContainerNode()) {
            for (JsonNode child : node) {
                max = Math.max(max, measureJsonDepth(child, depth + 1));
            }
        }
        return max;
    }

    private FileCategory detectCategory(String extension) {
        if (extension == null) return FileCategory.BINARY;
        if (CODE_EXTENSIONS.contains(extension)) return FileCategory.CODE;
        if (JSON_EXTENSIONS.contains(extension)) return FileCategory.JSON;
        if (TEXT_EXTENSIONS.contains(extension)) return FileCategory.TEXT;
        if (IMAGE_EXTENSIONS.contains(extension)) return FileCategory.IMAGE;
        if (PDF_EXTENSIONS.contains(extension)) return FileCategory.PDF;
        return FileCategory.BINARY;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private String humanReadableBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String prefix = "KMGTPE".charAt(exp - 1) + "";
        return String.format(Locale.ENGLISH, "%.1f %sB", bytes / Math.pow(1024, exp), prefix);
    }

    private String sha256Hex(Path path) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        try (var is = Files.newInputStream(path)) {
            int read;
            while ((read = is.read(buffer)) != -1) {
                md.update(buffer, 0, read);
            }
        }
        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void configurePdfStripper(PDFTextStripper stripper) {
        stripper.setSortByPosition(true);
        stripper.setStartPage(1);
        stripper.setEndPage(Integer.MAX_VALUE);
    }

    private enum FileCategory {
        CODE,
        JSON,
        TEXT,
        IMAGE,
        PDF,
        BINARY
    }
}
