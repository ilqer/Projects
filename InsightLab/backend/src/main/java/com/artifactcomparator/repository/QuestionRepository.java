package com.artifactcomparator.repository;

import com.artifactcomparator.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    List<Question> findByQuestionnaireIdOrderByDisplayOrderAsc(Long questionnaireId);
    
    List<Question> findByQuestionnaireIdAndIsActiveTrueOrderByDisplayOrderAsc(Long questionnaireId);
    
    Optional<Question> findByIdAndQuestionnaireId(Long id, Long questionnaireId);
}
