package com.artifactcomparator.repository;

import com.artifactcomparator.model.QuestionVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, Long> {
    
    List<QuestionVersion> findByQuestionIdOrderByVersionDesc(Long questionId);
    
    Optional<QuestionVersion> findByQuestionIdAndVersion(Long questionId, Integer version);
}
