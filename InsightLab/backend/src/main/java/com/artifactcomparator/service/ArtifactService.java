package com.artifactcomparator.service;

import java.util.zip.ZipInputStream;
import java.util.zip.ZipEntry;

import com.artifactcomparator.dto.ArtifactResponseDTO;
import com.artifactcomparator.dto.StudyResponseDTO;
import com.artifactcomparator.dto.TagDTO;
import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.StudyArtifact;
import com.artifactcomparator.model.StudyEnrollment;
import com.artifactcomparator.model.Tag;
import com.artifactcomparator.model.User;
import com.artifactcomparator.model.ReviewerAssignment;
import com.artifactcomparator.repository.ArtifactRepository;
import com.artifactcomparator.repository.StudyRepository;
import com.artifactcomparator.repository.StudyArtifactRepository;
import com.artifactcomparator.repository.StudyEnrollmentRepository;
import com.artifactcomparator.repository.TagRepository;
import com.artifactcomparator.repository.ReviewerAssignmentRepository;
import lombok.RequiredArgsConstructor;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtifactService {

    private final ArtifactRepository artifactRepository;
    private final StudyRepository studyRepository;
    private final StudyArtifactRepository studyArtifactRepository;
    private final StudyEnrollmentRepository studyEnrollmentRepository;
    private final TagRepository tagRepository;  // UC2-5: Add TagRepository
    private final ReviewerAssignmentRepository reviewerAssignmentRepository;

    @Value("${app.artifacts.storage-dir}")
    private String storageDir;

    @Value("${app.artifacts.allowed-types}")
    private String allowedTypesCsv;

    @Value("${app.artifacts.max-size}")
    private long maxSize;

    private Set<String> allowed() {
        return Arrays.stream(allowedTypesCsv.split(","))
                .map(String::trim).filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    @Transactional
    public List<ArtifactResponseDTO> upload(User user, List<MultipartFile> files, Study studyOpt) {
        ensureStorage();
        var allowedMime = allowed();  // application.properties -> app.artifacts.allowed-types

        // Uzantı bazlı whitelist (mock artifact'lere göre geniş)
        final Set<String> allowedExtensions = Set.of(
                "json", "md", "zip", "png", "jpg", "jpeg", "webp",
                "csv", "txt", "diff", "pkl", "java", "js", "jsx",
                "ts", "tsx", "py", "rb", "go", "c", "cpp", "h",
                "hpp", "cs", "kt", "swift", "scala", "rs", "sh", "pdf"
        );

        // ✅ NEW: Study içindeki mevcut artifact ID'lerini çek (asıl duplicate kontrol burada)
        final Set<UUID> existingStudyArtifactIds = new HashSet<>();
        if (studyOpt != null) {
            List<StudyArtifact> existing = studyArtifactRepository
                    .findByStudyIdOrderByDisplayOrderAsc(studyOpt.getId());

            for (StudyArtifact sa : existing) {
                if (sa.getArtifact() != null && sa.getArtifact().getId() != null) {
                    existingStudyArtifactIds.add(sa.getArtifact().getId());
                }
            }
        }
        List<ArtifactResponseDTO> saved = new ArrayList<>();

        for (MultipartFile mf : files) {
            if (mf.isEmpty()) {
                throw new IllegalArgumentException("Empty file: " + mf.getOriginalFilename());
            }
            if (mf.getSize() > maxSize) {
                throw new IllegalArgumentException(mf.getOriginalFilename() + " exceeds max size");
            }

            String originalName = mf.getOriginalFilename();
            String ct = Optional.ofNullable(mf.getContentType()).orElse("application/octet-stream");

            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
            }

            // 🔹 Eğer ZIP ise: içeriğini aç ve her entry'yi ayrı artifact olarak kaydet
            if ("zip".equals(ext) || "application/zip".equalsIgnoreCase(ct)) {
                try (ZipInputStream zis = new ZipInputStream(mf.getInputStream())) {
                    ZipEntry entry;
                    while ((entry = zis.getNextEntry()) != null) {
                        if (entry.isDirectory()) {
                            continue; // klasörleri atla
                        }

                        // Sadece dosya adını al (path içindeyse bile)
                        String entryName = Paths.get(entry.getName()).getFileName().toString();

                        String entryExt = "";
                        if (entryName.contains(".")) {
                            entryExt = entryName.substring(entryName.lastIndexOf('.') + 1).toLowerCase();
                        }

                        // Uzantı whitelist'inde değilse entry'yi atlıyoruz
                        if (!allowedExtensions.contains(entryExt)) {
                            // İstersen burada log atabilirsin
                            // log.warn("Skipping unsupported file in zip: {}", entryName);
                            continue;
                        }

                        // entry.getSize() bazen -1 olabilir, o yüzden hard limit kontrolünü
                        // burada sıkı yapmak istemiyorsan helper içinde de dosya boyutuna bakabilirsin.
                        Long entrySize = entry.getSize(); // -1 olabilir
                        if (entrySize != null && entrySize > maxSize) {
                            // Çok büyük dosyayı atla
                            continue;
                        }

                        // contentType tahmini: uzantıya göre grov bir karar
                        String entryCt = guessContentTypeFromExtension(entryExt);

                        ArtifactResponseDTO dto = storeSingleFileFromStream(
                                user,
                                studyOpt,
                                entryName,
                                entryCt,
                                entrySize != null && entrySize > 0 ? entrySize : 0L,
                                zis,
                                allowedMime
                        );
                        if (studyOpt != null && Boolean.TRUE.equals(dto.getDuplicate())) {
                            if (dto.getId() != null && existingStudyArtifactIds.contains(dto.getId())) {
                                throw new IllegalStateException(
                                        "This study already contains this artifact (duplicate upload is not allowed): "
                                                + (dto.getOriginalFilename() != null ? dto.getOriginalFilename() : entryName)
                                );
                            }
                        }
                        saved.add(dto);
                        // ✅ NEW: aynı batch içinde tekrar gelmesini engelle (zip içi)
                        if (studyOpt != null && dto.getId() != null) {
                            existingStudyArtifactIds.add(dto.getId());
                        }
                                            }
                } catch (IOException e) {
                    throw new RuntimeException("Failed processing zip file: " + originalName, e);
                }
            } else {
                // 🔹 Normal tekil dosya (ZIP değil)
                if (!allowedMime.contains(ct) && !allowedExtensions.contains(ext)) {
                    throw new IllegalArgumentException(
                            originalName + " has unsupported type. contentType=" + ct + ", ext=" + ext
                    );
                }

                try (InputStream in = mf.getInputStream()) {
                    ArtifactResponseDTO dto = storeSingleFileFromStream(
                            user,
                            studyOpt,
                            originalName,
                            ct,
                            mf.getSize(),
                            in,
                            allowedMime
                    );
                    // ✅ NEW: Study içinde aynı artifact (SHA aynı => same artifact id) varsa ENGELLE
                    if (studyOpt != null && Boolean.TRUE.equals(dto.getDuplicate())) {
                        if (dto.getId() != null && existingStudyArtifactIds.contains(dto.getId())) {
                            throw new IllegalStateException(
                                    "This study already contains this artifact (duplicate upload is not allowed): "
                                            + (dto.getOriginalFilename() != null ? dto.getOriginalFilename() : originalName)
                            );
                        }
                    }
                    saved.add(dto);
                    // ✅ NEW: aynı batch içinde tekrar gelmesini engelle
                    if (studyOpt != null && dto.getId() != null) {
                        existingStudyArtifactIds.add(dto.getId());
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed reading file " + originalName, e);
                }
            }
        }

        return saved;
    }

    private String guessContentTypeFromExtension(String ext) {
        if (ext == null) return "application/octet-stream";
        switch (ext) {
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            case "pdf": return "application/pdf";
            case "json": return "application/json";
            case "csv": return "text/csv";
            case "md": return "text/markdown";
            case "txt":
            case "diff":
            case "java": return "text/plain";
            case "zip": return "application/zip";
            default: return "application/octet-stream";
        }
    }

    private ArtifactResponseDTO storeSingleFileFromStream(
        User user,
        Study studyOpt,
        String originalFilename,
        String contentType,
        long sizeBytes,
        InputStream in,
        Set<String> allowedMime
    ) {
        // STEP 1: Temp'e kaydet
        String safeName = (originalFilename != null) ? originalFilename : "unnamed";
        String tempName = "temp-" + UUID.randomUUID() + "-" + sanitize(safeName);
        Path tempPath = Path.of(storageDir).resolve(tempName);

        try {
            Files.copy(in, tempPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed saving " + safeName, e);
        }

        // STEP 2: SHA-256 hesapla
        String sha256;
        try {
            sha256 = sha256Hex(tempPath);
        } catch (Exception e) {
            try { Files.deleteIfExists(tempPath); } catch (IOException ignored) {}
            throw new RuntimeException("Failed hashing " + safeName, e);
        }

        // STEP 3: Duplicate kontrolü
        Optional<Artifact> existingArtifact = artifactRepository.findBySha256(sha256);
        if (existingArtifact.isPresent()) {
            try { Files.deleteIfExists(tempPath); } catch (IOException ignored) {}

            ArtifactResponseDTO dto = toDto(existingArtifact.get());
            dto.setDuplicate(true);
            return dto;
        }

        // STEP 4: Final isme taşı
        String storedName = UUID.randomUUID() + "-" + sanitize(safeName);
        Path finalPath = Path.of(storageDir).resolve(storedName);

        try {
            Files.move(tempPath, finalPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            try { Files.deleteIfExists(tempPath); } catch (IOException ignored) {}
            throw new RuntimeException("Failed moving file " + safeName, e);
        }

        // STEP 5: Metadata (görsel boyutu / pdf sayfa sayısı)
        Integer width = null, height = null, pages = null;
        try {
            if (contentType != null && contentType.startsWith("image/")) {
                BufferedImage img = ImageIO.read(finalPath.toFile());
                if (img != null) {
                    width = img.getWidth();
                    height = img.getHeight();
                }
            } else if ("application/pdf".equals(contentType)) {
                try (PdfDocument pdfDoc = new PdfDocument(new PdfReader(finalPath.toFile()))) {
                    pages = pdfDoc.getNumberOfPages();
                }
            }
        } catch (Exception ignored) {}

        // STEP 6: DB'ye kaydet
        Artifact a = Artifact.builder()
                .originalFilename(safeName)
                .storedFilename(storedName)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .sizeBytes(sizeBytes)
                .sha256(sha256)
                .width(width)
                .height(height)
                .pageCount(pages)
                .uploadedBy(user)
                .study(studyOpt)
                .build();

        // 🔹 UC2-5: Auto-tag "user-created"
        List<Tag> userCreatedTags = tagRepository.findByName("user-created");
        Tag userCreated;
        if (!userCreatedTags.isEmpty()) {
            userCreated = userCreatedTags.get(0);
        } else {
            userCreated = tagRepository.save(Tag.builder()
                .name("user-created")
                .color("#22C55E")
                .description("Automatically assigned to artifacts uploaded manually by a user.")
                .createdBy(user) // Set creator as current user if creating for first time
                .build()
            );
        }

        a.addTag(userCreated);
        Artifact savedEnt = artifactRepository.save(a);

        ArtifactResponseDTO dto = toDto(savedEnt);
        dto.setDuplicate(false);
        return dto;
    }


    public List<ArtifactResponseDTO> listMine(User user) {
        return artifactRepository.findByUploadedByOrderByCreatedAtDesc(user)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // UC2-7: Get artifact by ID with authorization check
    @Transactional(readOnly = true)
    public ArtifactResponseDTO getArtifactById(UUID id, User user) {
        Artifact artifact = artifactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // ADMIN her artifact'ı görebilsin
        if (user.getRole() == User.Role.ADMIN) {
            return toDto(artifact);
        }

        // Security check:
        // - Artifact owner (researcher) can always view
        // - Participants can view artifacts that are in studies they're enrolled in
        // - Reviewers can view artifacts that are in studies they're assigned to review
        boolean isOwner = artifact.getUploadedBy() != null
                && artifact.getUploadedBy().getId() != null
                && artifact.getUploadedBy().getId().equals(user.getId());

        boolean isParticipantInStudy = false;
        boolean isReviewerInStudy = false;

        if (!isOwner && user.getRole() == User.Role.PARTICIPANT) {
            // Check if artifact is assigned to any study the participant is enrolled in
            List<StudyArtifact> assignments = studyArtifactRepository.findByArtifactId(id);

            // Get all studies where the participant is enrolled
            List<StudyEnrollment> enrollments = studyEnrollmentRepository.findByParticipantId(user.getId());
            List<Long> enrolledStudyIds = enrollments.stream()
                    .filter(e -> e.getStatus() == StudyEnrollment.EnrollmentStatus.ENROLLED ||
                                e.getStatus() == StudyEnrollment.EnrollmentStatus.IN_PROGRESS ||
                                e.getStatus() == StudyEnrollment.EnrollmentStatus.COMPLETED)
                    .map(e -> e.getStudy().getId())
                    .collect(Collectors.toList());

            // Check if any of the artifact's assigned studies match the participant's enrolled studies
            isParticipantInStudy = assignments.stream()
                    .anyMatch(sa -> enrolledStudyIds.contains(sa.getStudy().getId()));
        }

        if (!isOwner && user.getRole() == User.Role.REVIEWER) {
            // Check if artifact is assigned to any study the reviewer is assigned to
            List<StudyArtifact> assignments = studyArtifactRepository.findByArtifactId(id);

            // Get all studies where the reviewer is assigned
            List<ReviewerAssignment> reviewerAssignments = reviewerAssignmentRepository.findByReviewerIdOrderByAssignedAtDesc(user.getId());
            List<Long> assignedStudyIds = reviewerAssignments.stream()
                    .filter(ra -> ra.getStatus() == ReviewerAssignment.AssignmentStatus.ACCEPTED)
                    .map(ra -> ra.getStudy().getId())
                    .collect(Collectors.toList());

            // Check if any of the artifact's assigned studies match the reviewer's assigned studies
            isReviewerInStudy = assignments.stream()
                    .anyMatch(sa -> assignedStudyIds.contains(sa.getStudy().getId()));
        }

        if (!isOwner && !isParticipantInStudy && !isReviewerInStudy) {
            throw new AccessDeniedException("Access denied: You don't have permission to view this artifact");
        }

        return toDto(artifact);
    }

    public DownloadResult download(UUID id, User user) {
        Artifact artifact = artifactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // Security check: owner can always download
        boolean isOwner = artifact.getUploadedBy() != null 
                && artifact.getUploadedBy().getId() != null
                && artifact.getUploadedBy().getId().equals(user.getId());
        boolean isParticipant = user.getRole() == User.Role.PARTICIPANT;
        boolean isReviewer = user.getRole() == User.Role.REVIEWER;
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        
        if (!isOwner && !isParticipant && !isReviewer && !isAdmin) {
            throw new AccessDeniedException("Access denied");
        }

        Path filePath = Path.of(storageDir).resolve(artifact.getStoredFilename());

        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("File not found on disk");
        }

        try {
            org.springframework.core.io.Resource resource =
                    new org.springframework.core.io.UrlResource(filePath.toUri());
            return new DownloadResult(artifact, resource);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load file", e);
        }
    }

    /**
     * Internal helper: load artifact content as a Resource without user checks.
     * Used by services that need direct access to study artifacts (e.g., evaluation builder, snapshot viewer).
     */
    @Transactional(readOnly = true)
    public Resource getArtifactContent(UUID id) {
        Artifact artifact = artifactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        Path filePath = Path.of(storageDir).resolve(artifact.getStoredFilename());
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("File not found on disk");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("Unable to read artifact content");
            }
            return resource;
        } catch (Exception e) {
            throw new RuntimeException("Failed to load artifact content", e);
        }
    }

    /**
     * NEW: Delete an artifact the user owns. Removes file from disk, then deletes DB row.
     */
    @Transactional
    public void deleteById(UUID id, User user) {
        Artifact artifact = artifactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // Security check: only the owner can delete
        if (!artifact.getUploadedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Try to delete the physical file first (if present)
        Path filePath = Path.of(storageDir).resolve(artifact.getStoredFilename());
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // You can choose to fail hard or log and continue. Here we fail to avoid orphan DB state.
            throw new RuntimeException("Failed to delete file from disk", e);
        }

        // Remove DB row
        artifactRepository.delete(artifact);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class DownloadResult {
        private Artifact artifact;
        private org.springframework.core.io.Resource resource;
    }

    private void ensureStorage() {
        try {
            Files.createDirectories(Path.of(storageDir));
        } catch (IOException e) {
            throw new RuntimeException("Cannot create storage dir: " + storageDir, e);
        }
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static String sha256Hex(Path path) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (InputStream is = Files.newInputStream(path)) {
            byte[] buf = new byte[8192];
            int r;
            while ((r = is.read(buf)) > 0) md.update(buf, 0, r);
        }
        StringBuilder sb = new StringBuilder();
        for (byte b : md.digest()) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    /**
     * DTO mapper – SHA-256 BİLGİSİNİ BİLİNÇLİ OLARAK EKLEMİYORUZ.
     */
    private ArtifactResponseDTO toDto(Artifact a) {
        // UC2-5: Include tags in the response
        List<TagDTO> tagDTOs = null;
        if (a.getTags() != null && !a.getTags().isEmpty()) {
            tagDTOs = a.getTags().stream()
                    .map(tag -> TagDTO.builder()
                            .id(tag.getId())
                            .name(tag.getName())
                            .color(tag.getColor())
                            .description(tag.getDescription())
                            .createdById(tag.getCreatedBy().getId())
                            .createdByName(tag.getCreatedBy().getFullName())
                            .createdAt(tag.getCreatedAt())
                            .updatedAt(tag.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        return ArtifactResponseDTO.builder()
                .id(a.getId())
                .originalFilename(a.getOriginalFilename())
                .contentType(a.getContentType())
                .sizeBytes(a.getSizeBytes())
                // .sha256(...) YOK → kullanıcıya gitmiyor
                .width(a.getWidth())
                .height(a.getHeight())
                .pageCount(a.getPageCount())
                .createdAt(a.getCreatedAt())
                .tags(tagDTOs)
                .build();
    }

    // UC2-5: Add tags to artifact
    @Transactional
    public ArtifactResponseDTO addTagsToArtifact(UUID artifactId, List<Long> tagIds, User user) {
        Artifact artifact = artifactRepository.findById(artifactId)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // Security check: only owner can add tags
        if (!artifact.getUploadedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied: You can only tag your own artifacts");
        }

        // Find all tags by IDs
        List<Tag> tagsToAdd = tagRepository.findAllById(tagIds);

        // Verify all tags belong to the user
        for (Tag tag : tagsToAdd) {
            if (tag.getCreatedBy() != null && !tag.getCreatedBy().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied: Tag '" + tag.getName() + "' does not belong to you");
            }
            artifact.addTag(tag);
        }

        Artifact updated = artifactRepository.save(artifact);
        return toDto(updated);
    }

    // UC2-5: Remove tag from artifact
    @Transactional
    public ArtifactResponseDTO removeTagFromArtifact(UUID artifactId, Long tagId, User user) {
        Artifact artifact = artifactRepository.findById(artifactId)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // Security check: only owner can remove tags
        if (!artifact.getUploadedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        artifact.removeTag(tag);
        Artifact updated = artifactRepository.save(artifact);
        return toDto(updated);
    }

    // UC2-5 / UC2-4: Search and filter artifacts (4 senaryoyu da yönetir)
    @Transactional(readOnly = true)
    public List<ArtifactResponseDTO> searchArtifacts(String rawSearchTerm, List<Long> tagIds, User user) {
        String searchTerm = (rawSearchTerm == null) ? "" : rawSearchTerm.trim();
        boolean hasText = !searchTerm.isEmpty();
        boolean hasTags = tagIds != null && !tagIds.isEmpty();

        List<Artifact> artifacts;

        // 1) Text yok, tag yok -> tüm artifact'lar
        if (!hasText && !hasTags) {
            artifacts = artifactRepository.findByUploadedByOrderByCreatedAtDesc(user);

        // 2) Sadece text var
        } else if (hasText && !hasTags) {
            artifacts = artifactRepository.searchByTerm(searchTerm, user);

        // 3) Sadece tag var
        } else if (!hasText && hasTags) {
            artifacts = artifactRepository.findByTagIdsAndUploadedBy(tagIds, user);

        // 4) Text + tag var
        } else {
            artifacts = artifactRepository.searchByTermAndTags(searchTerm, tagIds, user);
        }

        // Ek: Kullanıcı direkt ID (UUID) yapıştırırsa, onu da deneyelim
        if ((artifacts == null || artifacts.isEmpty()) && hasText) {
            try {
                UUID artifactId = UUID.fromString(searchTerm);

                Optional<Artifact> opt = artifactRepository.findById(artifactId)
                        .filter(a -> a.getUploadedBy().getId().equals(user.getId()));

                if (opt.isPresent()) {
                    artifacts = List.of(opt.get());
                }
            } catch (IllegalArgumentException ignored) {
                // geçerli UUID değilse sessizce geç
            }
        }


        return artifacts.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ArtifactResponseDTO> listAll(User user) {
        return artifactRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    // UC2-6: Assign artifact to study
    @Transactional
    public void assignToStudy(UUID artifactId, Long studyId, User user, String displayLabel) {
        // Get the artifact
        Artifact artifact = artifactRepository.findById(artifactId)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // Get the study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Permission check: Only the study owner can assign artifacts
        if (!study.getResearcher().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only assign artifacts to your own studies");
        }

        // Check if already assigned
        if (studyArtifactRepository.existsByStudyIdAndArtifactId(studyId, artifactId)) {
            throw new IllegalStateException("Artifact is already assigned to this study");
        }

        // Get the next display order
        List<StudyArtifact> existing = studyArtifactRepository.findByStudyIdOrderByDisplayOrderAsc(studyId);
        int nextOrder = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1;

        // Create the assignment
        StudyArtifact studyArtifact = new StudyArtifact();
        studyArtifact.setStudy(study);
        studyArtifact.setArtifact(artifact);
        studyArtifact.setDisplayOrder(nextOrder);
        studyArtifact.setDisplayLabel(displayLabel);

        studyArtifactRepository.save(studyArtifact);
    }

    // UC2-6: Unassign artifact from study
    @Transactional
    public void unassignFromStudy(UUID artifactId, Long studyId, User user) {
        // Get the study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("Study not found"));

        // Permission check: Only the study owner can unassign artifacts
        if (!study.getResearcher().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only unassign artifacts from your own studies");
        }

        // Remove the assignment
        studyArtifactRepository.deleteByStudyIdAndArtifactId(studyId, artifactId);
    }

    // UC2-6: Get studies where artifact is assigned
    @Transactional(readOnly = true)
    public List<StudyResponseDTO> getArtifactStudies(UUID artifactId, User user) {
        // Get the artifact
        Artifact artifact = artifactRepository.findById(artifactId)
                .orElseThrow(() -> new IllegalArgumentException("Artifact not found"));

        // Permission check: User must be the artifact owner or study owner
        List<StudyArtifact> assignments = studyArtifactRepository.findByArtifactId(artifactId);

        return assignments.stream()
                .map(StudyArtifact::getStudy)
                .filter(study -> study.getResearcher().getId().equals(user.getId()) ||
                                 artifact.getUploadedBy().getId().equals(user.getId()))
                .map(this::convertStudyToDTO)
                .collect(Collectors.toList());
    }

    private StudyResponseDTO convertStudyToDTO(Study study) {
        StudyResponseDTO dto = new StudyResponseDTO();
        dto.setId(study.getId());
        dto.setTitle(study.getTitle());
        dto.setDescription(study.getDescription());
        dto.setObjective(study.getObjective());
        dto.setStatus(study.getStatus().name());
        dto.setStartDate(study.getStartDate());
        dto.setEndDate(study.getEndDate());
        dto.setResearcherId(study.getResearcher().getId());
        dto.setResearcherName(study.getResearcher().getFullName());
        dto.setCreatedAt(study.getCreatedAt());
        dto.setUpdatedAt(study.getUpdatedAt());
        dto.setComparisonType(study.getComparisonType());
        dto.setBlindedMode(study.getBlindedMode());
        dto.setMaxParticipants(study.getMaxParticipants());
        return dto;
    }
}
