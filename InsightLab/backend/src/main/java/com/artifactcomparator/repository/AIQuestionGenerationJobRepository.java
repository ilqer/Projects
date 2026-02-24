package com.artifactcomparator.repository;

import com.artifactcomparator.model.AIQuestionGenerationJob;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIQuestionGenerationJobRepository extends JpaRepository<AIQuestionGenerationJob, Long> {
    
    List<AIQuestionGenerationJob> findByResearcherOrderByCreatedAtDesc(User researcher);
    
    List<AIQuestionGenerationJob> findByResearcherIdOrderByCreatedAtDesc(Long researcherId);
    
    List<AIQuestionGenerationJob> findByStatus(AIQuestionGenerationJob.JobStatus status);
    
    List<AIQuestionGenerationJob> findByQuestionnaireIdOrderByCreatedAtDesc(Long questionnaireId);
}

