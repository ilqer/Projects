package com.artifactcomparator.service.evaluation;

import com.artifactcomparator.service.ArtifactService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageStorageService {

    @Value("${app.artifacts.storage-dir:/app/storage/artifacts}")
    private String storageDir;

    private final ArtifactService artifactService;

    private void ensureStorage() {
        try {
            Path dir = Path.of(storageDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to create storage directory", e);
        }
    }

    /**
     * Store an image and return its UUID
     */
    public UUID storeImage(MultipartFile file) {
        ensureStorage();

        // Validate it's an image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Validate max size (10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Image size exceeds 10MB limit");
        }

        // Generate UUID for the image
        UUID imageId = UUID.randomUUID();
        String storedFilename = imageId.toString() + getFileExtension(file.getOriginalFilename());
        Path targetPath = Path.of(storageDir).resolve(storedFilename);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Validate it's actually a valid image
            BufferedImage img = ImageIO.read(targetPath.toFile());
            if (img == null) {
                Files.deleteIfExists(targetPath);
                throw new IllegalArgumentException("Invalid image file");
            }
        } catch (IOException e) {
            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ignored) {}
            throw new RuntimeException("Failed to store image: " + file.getOriginalFilename(), e);
        }

        return imageId;
    }

    public Resource loadImage(UUID imageId) {
        try {
            Resource evaluationImage = loadFromEvaluationStorage(imageId);
            if (evaluationImage != null) {
                return evaluationImage;
            }
            // Fallback to study artifact storage
            return artifactService.getArtifactContent(imageId);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to load image: " + imageId, e);
        }
    }

    /**
     * Find the image file path by UUID (trying different extensions)
     */
    private Path findImagePath(UUID imageId) {
        String[] extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp", ""};

        for (String ext : extensions) {
            Path path = Path.of(storageDir).resolve(imageId.toString() + ext);
            if (Files.exists(path)) {
                return path;
            }
        }

        return null;
    }

    private Resource loadFromEvaluationStorage(UUID imageId) {
        Path imagePath = findImagePath(imageId);
        if (imagePath == null) {
            return null;
        }

        try {
            Resource resource = new UrlResource(imagePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * Delete an image by UUID
     */
    public void deleteImage(UUID imageId) {
        try {
            Path imagePath = findImagePath(imageId);
            if (imagePath != null) {
                Files.deleteIfExists(imagePath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete image: " + imageId, e);
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return ".png";
        }

        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot);
        }

        return ".png";
    }
}
