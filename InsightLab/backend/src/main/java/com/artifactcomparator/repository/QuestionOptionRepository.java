package com.artifactcomparator.repository;

import com.artifactcomparator.model.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    
    List<QuestionOption> findByQuestionIdOrderByDisplayOrderAsc(Long questionId);
    
    void deleteByQuestionId(Long questionId);
}
