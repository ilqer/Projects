package com.artifactcomparator.repository;

import com.artifactcomparator.model.Artifact;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArtifactRepository extends JpaRepository<Artifact, UUID> {

    List<Artifact> findByUploadedByOrderByCreatedAtDesc(User user);

    Optional<Artifact> findBySha256(String sha256);

    Optional<Artifact> findBySha256AndUploadedBy(String sha256, User user);

    // ------------------------------------------------
    // UC2-4 / UC2-5: TEXT SEARCH (name, type, sha256)
    // (Tag filtresi yokken veya sadece text için)
    // ------------------------------------------------
    @Query("""
        SELECT DISTINCT a FROM Artifact a
        WHERE a.uploadedBy = :user
          AND (
                :searchTerm IS NULL
             OR :searchTerm = ''
             OR LOWER(a.originalFilename) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(a.contentType) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(a.sha256) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
          )
        ORDER BY a.createdAt DESC
    """)
    List<Artifact> searchByTerm(
            @Param("searchTerm") String searchTerm,
            @Param("user") User user
    );

    // ------------------------------------------------
    // UC2-4 / UC2-5: TEXT + TAG FILTER
    // ------------------------------------------------
    @Query("""
        SELECT DISTINCT a FROM Artifact a
        JOIN a.tags t
        WHERE a.uploadedBy = :user
          AND t.id IN :tagIds
          AND (
                :searchTerm IS NULL
             OR :searchTerm = ''
             OR LOWER(a.originalFilename) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(a.contentType) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
             OR LOWER(a.sha256) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
          )
        ORDER BY a.createdAt DESC
    """)
    List<Artifact> searchByTermAndTags(
            @Param("searchTerm") String searchTerm,
            @Param("tagIds") List<Long> tagIds,
            @Param("user") User user
    );

    // ------------------------------------------------
    // UC2-5: ONLY TAG FILTER (searchTerm yokken)
    // ------------------------------------------------
    @Query("""
        SELECT DISTINCT a FROM Artifact a
        JOIN a.tags t
        WHERE t.id IN :tagIds
          AND a.uploadedBy = :user
        ORDER BY a.createdAt DESC
    """)
    List<Artifact> findByTagIdsAndUploadedBy(@Param("tagIds") List<Long> tagIds,
                                             @Param("user") User user);
}
