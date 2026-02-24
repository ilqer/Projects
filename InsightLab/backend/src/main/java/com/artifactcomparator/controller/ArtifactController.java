package com.artifactcomparator.controller;

import com.artifactcomparator.dto.AddTagsToArtifactRequest;
import com.artifactcomparator.dto.ArtifactAnalyticsResponse;
import com.artifactcomparator.dto.ArtifactResponseDTO;
import com.artifactcomparator.dto.StudyResponseDTO;
import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.Study;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.StudyRepository;
import com.artifactcomparator.security.CustomUserDetailsService;
import com.artifactcomparator.service.ArtifactAnalysisService;
import com.artifactcomparator.service.ArtifactService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/artifacts")
@RequiredArgsConstructor
public class ArtifactController {

    private final ArtifactService artifactService;
    private final StudyRepository studyRepository;
    private final ArtifactAnalysisService artifactAnalysisService;

    // UC2-1: upload
    @PostMapping
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<List<ArtifactResponseDTO>> upload(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "studyId", required = false) Long studyId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        if (files == null || files.isEmpty())
            throw new IllegalArgumentException("No files received");

        Study study = null;
        if (studyId != null) {
            study = studyRepository.findById(studyId)
                    .orElseThrow(() -> new IllegalArgumentException("Study not found"));
        }

        User user = principal.getUser();
        var saved = artifactService.upload(user, files, study);

        // ✅ FIX: Study içindeyken duplicate olanları tekrar assign ETME
        if (study != null) {
            for (ArtifactResponseDTO dto : saved) {
                if (Boolean.TRUE.equals(dto.getDuplicate())) {
                    continue; // 🚫 zaten var (sha256 duplicate) -> study'e ekleme
                }
                artifactService.assignToStudy(dto.getId(), study.getId(), user, null);
            }
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<List<ArtifactResponseDTO>> mine(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        return ResponseEntity.ok(artifactService.listMine(user));
    }

    // 🔍 UC2-4 / UC2-5: Search artifacts (text + tag filtreleri)
    // Frontend: GET /artifacts/search?query=...&tagIds=1&tagIds=2
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<List<ArtifactResponseDTO>> searchArtifacts(
            @RequestParam(value = "query", required = false) String query,

            // Axios çoğu zaman ?tagIds[]=1&tagIds[]=2 şeklinde gönderiyor
            @RequestParam(value = "tagIds", required = false) List<Long> tagIds,
            @RequestParam(value = "tagIds[]", required = false) List<Long> tagIdsBracket,

            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();

        // Hangisi doluysa onu kullan
        List<Long> effectiveTagIds = (tagIds != null && !tagIds.isEmpty())
                ? tagIds
                : tagIdsBracket;

        List<ArtifactResponseDTO> results = artifactService.searchArtifacts(query, effectiveTagIds, user);
        return ResponseEntity.ok(results);
    }

    // UC2-7: Get artifact details by ID (with authorization check)
    @GetMapping("/{id}")
    public ResponseEntity<ArtifactResponseDTO> getById(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        ArtifactResponseDTO artifact = artifactService.getArtifactById(id, user);
        return ResponseEntity.ok(artifact);
    }

    @GetMapping("/{id}/analytics")
    public ResponseEntity<ArtifactAnalyticsResponse> getAnalytics(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        ArtifactAnalyticsResponse analytics = artifactAnalysisService.analyzeArtifact(id, user);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ArtifactResponseDTO>> getAll(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        return ResponseEntity.ok(artifactService.listAll(user));
    }

    // UC2-3: Download artifact
    // Researchers/Admins can download any artifact they own
    // Participants can download artifacts from their evaluation tasks
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();

        var result = artifactService.download(id, user);
        Artifact artifact = result.getArtifact();
        Resource resource = result.getResource();

        String encodedFilename = URLEncoder.encode(
                artifact.getOriginalFilename(), StandardCharsets.UTF_8
        ).replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(artifact.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedFilename)
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                .body(resource);
    }

    // UC2-7: Delete artifact (only owner can delete)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        artifactService.deleteById(id, user);
        return ResponseEntity.noContent().build();
    }

    // UC2-6: Assign artifacts to a study
    @PostMapping("/{id}/assign-to-study/{studyId}")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<Void> assignToStudy(
            @PathVariable UUID id,
            @PathVariable Long studyId,
            @RequestParam(required = false) String displayLabel,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        artifactService.assignToStudy(id, studyId, user, displayLabel);
        return ResponseEntity.ok().build();
    }

    // UC2-6: Unassign artifact from a study
    @DeleteMapping("/{id}/unassign-from-study/{studyId}")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<Void> unassignFromStudy(
            @PathVariable UUID id,
            @PathVariable Long studyId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        artifactService.unassignFromStudy(id, studyId, user);
        return ResponseEntity.noContent().build();
    }

    // UC2-6: Get studies where this artifact is assigned
    @GetMapping("/{id}/studies")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<List<StudyResponseDTO>> getArtifactStudies(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        List<StudyResponseDTO> studies = artifactService.getArtifactStudies(id, user);
        return ResponseEntity.ok(studies);
    }

    // 🟢 UC2-5: Add tags to artifact (RESEARCHER/ADMIN)
    @PostMapping("/{id}/tags")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<ArtifactResponseDTO> addTagsToArtifact(
            @PathVariable("id") UUID artifactId,
            @RequestBody AddTagsToArtifactRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        ArtifactResponseDTO dto = artifactService.addTagsToArtifact(artifactId, request.getTagIds(), user);
        return ResponseEntity.ok(dto);
    }

    // 🟢 UC2-5: Remove tag from artifact (RESEARCHER/ADMIN)
    @DeleteMapping("/{id}/tags/{tagId}")
    @PreAuthorize("hasAnyRole('RESEARCHER','ADMIN')")
    public ResponseEntity<ArtifactResponseDTO> removeTagFromArtifact(
            @PathVariable("id") UUID artifactId,
            @PathVariable Long tagId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        ArtifactResponseDTO dto = artifactService.removeTagFromArtifact(artifactId, tagId, user);
        return ResponseEntity.ok(dto);
    }
}
