package com.artifactcomparator.controller;

import com.artifactcomparator.dto.CreateTagRequest;
import com.artifactcomparator.dto.TagDTO;
import com.artifactcomparator.dto.UpdateTagRequest;
import com.artifactcomparator.model.User;
import com.artifactcomparator.security.CustomUserDetailsService;
import com.artifactcomparator.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    // UC2-5: Get all tags for current user
    @GetMapping
    public ResponseEntity<List<TagDTO>> getAllTags(
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        List<TagDTO> tags = tagService.getAllTags(user);
        return ResponseEntity.ok(tags);
    }

    // UC2-5: Search tags by name
    @GetMapping("/search")
    public ResponseEntity<List<TagDTO>> searchTags(
            @RequestParam String query,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        List<TagDTO> tags = tagService.searchTags(query, user);
        return ResponseEntity.ok(tags);
    }

    // UC2-5: Get tag by ID
    @GetMapping("/{id}")
    public ResponseEntity<TagDTO> getTagById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        TagDTO tag = tagService.getTagById(id, user);
        return ResponseEntity.ok(tag);
    }

    // UC2-5: Create new tag
    @PostMapping
    public ResponseEntity<TagDTO> createTag(
            @RequestBody CreateTagRequest request,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        TagDTO created = tagService.createTag(request, user);
        return ResponseEntity.ok(created);
    }

    // UC2-5: Update tag
    @PutMapping("/{id}")
    public ResponseEntity<TagDTO> updateTag(
            @PathVariable Long id,
            @RequestBody UpdateTagRequest request,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        TagDTO updated = tagService.updateTag(id, request, user);
        return ResponseEntity.ok(updated);
    }

    // UC2-5: Delete tag
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetailsService.CustomUserPrincipal principal
    ) {
        User user = principal.getUser();
        tagService.deleteTag(id, user);
        return ResponseEntity.noContent().build();
    }
}