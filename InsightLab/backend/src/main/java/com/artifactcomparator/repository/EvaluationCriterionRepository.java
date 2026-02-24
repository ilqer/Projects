package com.artifactcomparator.repository;

import com.artifactcomparator.model.EvaluationCriterion;
import com.artifactcomparator.model.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationCriterionRepository extends JpaRepository<EvaluationCriterion, Long> {
    
    List<EvaluationCriterion> findByStudyOrderByDisplayOrderAsc(Study study);
    
    List<EvaluationCriterion> findByStudyIdOrderByDisplayOrderAsc(Long studyId);
    
    void deleteByStudy(Study study);
}
