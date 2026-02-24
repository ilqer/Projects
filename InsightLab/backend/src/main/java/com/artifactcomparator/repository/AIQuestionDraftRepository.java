package com.artifactcomparator.repository;

import com.artifactcomparator.model.AIQuestionDraft;
import com.artifactcomparator.model.AIQuestionGenerationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIQuestionDraftRepository extends JpaRepository<AIQuestionDraft, Long> {
    
    List<AIQuestionDraft> findByJobOrderByDisplayOrderAsc(AIQuestionGenerationJob job);
    
    List<AIQuestionDraft> findByJobIdOrderByDisplayOrderAsc(Long jobId);
    
    List<AIQuestionDraft> findByQuestionnaireIdAndStatusOrderByCreatedAtDesc(
            Long questionnaireId, 
            AIQuestionDraft.DraftStatus status
    );
    
    List<AIQuestionDraft> findByQuestionnaireIdAndStatusInOrderByCreatedAtDesc(
            Long questionnaireId,
            List<AIQuestionDraft.DraftStatus> statuses
    );
    
    List<AIQuestionDraft> findByStatus(AIQuestionDraft.DraftStatus status);
}

