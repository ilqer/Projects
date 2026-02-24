package com.artifactcomparator.repository;

import com.artifactcomparator.model.AIArtifactGenerationJob;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIArtifactGenerationJobRepository extends JpaRepository<AIArtifactGenerationJob, Long> {
    
    List<AIArtifactGenerationJob> findByResearcherOrderByCreatedAtDesc(User researcher);
    
    List<AIArtifactGenerationJob> findByStatusOrderByCreatedAtDesc(AIArtifactGenerationJob.JobStatus status);
}
