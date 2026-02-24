package com.artifactcomparator.repository;

import com.artifactcomparator.model.AIQuestionDraftOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIQuestionDraftOptionRepository extends JpaRepository<AIQuestionDraftOption, Long> {
    
    List<AIQuestionDraftOption> findByDraftIdOrderByDisplayOrderAsc(Long draftId);
}

