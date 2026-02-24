package com.artifactcomparator.service;

import com.artifactcomparator.dto.CreateTagRequest;
import com.artifactcomparator.dto.TagDTO;
import com.artifactcomparator.dto.UpdateTagRequest;
import com.artifactcomparator.model.Tag;
import com.artifactcomparator.model.User;
import com.artifactcomparator.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {
    
    private final TagRepository tagRepository;

    @Transactional
    public Tag findOrCreateTag(String name) {
        List<Tag> existingTags = tagRepository.findByName(name);
        if (!existingTags.isEmpty()) {
            return existingTags.get(0); // Return the first one if duplicates exist
        } else {
            Tag newTag = new Tag();
            newTag.setName(name);
            if ("user-created".equals(name)) {
                newTag.setColor("#2e7d32"); // Darker Green for better contrast
                newTag.setDescription("Automatically assigned to artifacts uploaded manually by a user.");
            } else if ("ai-created".equals(name)) {
                newTag.setColor("#9c27b0"); // Vibrant Purple for better contrast
                newTag.setDescription("Automatically assigned to artifacts created by AI.");
            }
            return tagRepository.save(newTag);
        }
    }

    @Transactional(readOnly = true)
    public List<TagDTO> getAllTags(User user) {
        return tagRepository.findByCreatedByOrderByNameAsc(user).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TagDTO> searchTags(String searchTerm, User user) {
        return tagRepository.searchByName(searchTerm, user).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public TagDTO createTag(CreateTagRequest request, User user) {
        if (tagRepository.existsByNameAndCreatedBy(request.getName(), user)) {
            throw new IllegalStateException("Tag with this name already exists.");
        }
        Tag newTag = new Tag();
        newTag.setName(request.getName());
        newTag.setColor(request.getColor());
        newTag.setDescription(request.getDescription());
        newTag.setCreatedBy(user);
        return toDTO(tagRepository.save(newTag));
    }

    @Transactional
    public TagDTO updateTag(Long tagId, UpdateTagRequest request, User user) {
        Tag tag = tagRepository.findById(tagId).orElseThrow(() -> new IllegalArgumentException("Tag not found"));
        if (!tag.getCreatedBy().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only update your own tags.");
        }
        tag.setName(request.getName());
        tag.setColor(request.getColor());
        tag.setDescription(request.getDescription());
        return toDTO(tagRepository.save(tag));
    }

    @Transactional
    public void deleteTag(Long tagId, User user) {
        Tag tag = tagRepository.findById(tagId).orElseThrow(() -> new IllegalArgumentException("Tag not found"));
        if (!tag.getCreatedBy().getId().equals(user.getId())) {
            throw new IllegalStateException("You can only delete your own tags.");
        }
        tagRepository.delete(tag);
    }

    @Transactional(readOnly = true)
    public TagDTO getTagById(Long tagId, User user) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        // Security check: only owner can view
        if (!tag.getCreatedBy().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        return toDTO(tag);
    }

    private TagDTO toDTO(Tag tag) {
        return TagDTO.builder()
                .id(tag.getId())
                .name(tag.getName())
                .color(tag.getColor())
                .description(tag.getDescription())
                .createdById(tag.getCreatedBy() != null ? tag.getCreatedBy().getId() : null)
                .createdByName(tag.getCreatedBy() != null ? tag.getCreatedBy().getFullName() : null)
                .createdAt(tag.getCreatedAt())
                .updatedAt(tag.getUpdatedAt())
                .artifactCount(tag.getArtifacts() != null ? tag.getArtifacts().size() : 0)
                .build();
    }
}
