package com.artifactcomparator.repository;

import com.artifactcomparator.model.AIArtifactDraft;
import com.artifactcomparator.model.AIArtifactGenerationJob;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIArtifactDraftRepository extends JpaRepository<AIArtifactDraft, Long> {
    
    List<AIArtifactDraft> findByJobOrderByCreatedAtAsc(AIArtifactGenerationJob job);
    
    List<AIArtifactDraft> findByResearcherAndStatusInOrderByCreatedAtDesc(
            User researcher, 
            List<AIArtifactDraft.DraftStatus> statuses
    );
    
    List<AIArtifactDraft> findByResearcherAndStatusOrderByCreatedAtDesc(
            User researcher,
            AIArtifactDraft.DraftStatus status
    );
}
