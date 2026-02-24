package com.artifactcomparator.repository;

import com.artifactcomparator.model.StudyArtifact;
import com.artifactcomparator.model.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudyArtifactRepository extends JpaRepository<StudyArtifact, Long> {

    List<StudyArtifact> findByStudyOrderByDisplayOrderAsc(Study study);

    List<StudyArtifact> findByStudyIdOrderByDisplayOrderAsc(Long studyId);

    List<StudyArtifact> findByArtifactId(UUID artifactId);

    List<StudyArtifact> findByStudyIdIn(List<Long> studyIds);

    void deleteByStudy(Study study);

    void deleteByStudyIdAndArtifactId(Long studyId, UUID artifactId);

    boolean existsByStudyIdAndArtifactId(Long studyId, UUID artifactId);

    // ✅ NEW: Study içinde aynı originalFilename var mı? (case-insensitive)
    @Query("""
        select (count(sa) > 0)
        from StudyArtifact sa
        where sa.study.id = :studyId
          and lower(sa.artifact.originalFilename) = lower(:filename)
    """)
    boolean existsByStudyIdAndArtifactOriginalFilenameIgnoreCase(
            @Param("studyId") Long studyId,
            @Param("filename") String filename
    );
}
