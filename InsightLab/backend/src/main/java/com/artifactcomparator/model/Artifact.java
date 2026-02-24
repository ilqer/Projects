package com.artifactcomparator.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "artifact")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Artifact {
    @Id
    @GeneratedValue
    private UUID id;
    
    private String originalFilename;
    private String storedFilename;
    private String contentType;
    private long sizeBytes;
    private String sha256;
    
    // Optional metadata
    private Integer width;     // images
    private Integer height;    // images
    private Integer pageCount; // pdfs
    
    @CreationTimestamp
    private Instant createdAt;
    
    // uploadedBy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id")
    private User uploadedBy;
    
    // Optional: link to a study if you want (nullable)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id")
    private Study study;
    
    // 🔹 UC2-5: Many-to-Many tags relationship
    @ManyToMany
    @JoinTable(
            name = "artifact_tags",                  // join table
            joinColumns = @JoinColumn(name = "artifact_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();
    
    // 🔹 Helper methods used in ArtifactService
    public void addTag(Tag tag) {
        if (tags == null) {
            tags = new HashSet<>();
        }
        tags.add(tag);
    }
    
    public void removeTag(Tag tag) {
        if (tags != null) {
            tags.remove(tag);
        }
    }
}