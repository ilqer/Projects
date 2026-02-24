package com.artifactcomparator.repository;

import com.artifactcomparator.model.Tag;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    // Find all tags created by a specific user
    List<Tag> findByCreatedByOrderByNameAsc(User user);
    
    // Find tag by name and creator
    Optional<Tag> findByNameAndCreatedBy(String name, User user);
    
    // Find tag by name - changed to return List to handle duplicates
    List<Tag> findByName(String name);
    
    // Search tags by name (case-insensitive, partial match)
    @Query("SELECT t FROM Tag t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :name, '%')) AND t.createdBy = :user ORDER BY t.name ASC")
    List<Tag> searchByName(@Param("name") String name, @Param("user") User user);
    
    // Check if tag exists for user
    boolean existsByNameAndCreatedBy(String name, User user);
    
    // Find tags used by specific artifact
    @Query("SELECT t FROM Tag t JOIN t.artifacts a WHERE a.id = :artifactId")
    List<Tag> findByArtifactId(@Param("artifactId") java.util.UUID artifactId);
}