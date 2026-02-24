package com.artifactcomparator.repository;

import com.artifactcomparator.model.Questionnaire;
import com.artifactcomparator.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionnaireRepository extends JpaRepository<Questionnaire, Long> {
    
    List<Questionnaire> findByResearcherOrderByCreatedAtDesc(User researcher);
    
    List<Questionnaire> findByResearcherIdOrderByCreatedAtDesc(Long researcherId);
    
    List<Questionnaire> findByResearcherAndIsActiveTrueOrderByCreatedAtDesc(User researcher);
    
    List<Questionnaire> findByResearcherIdAndIsActiveTrueOrderByCreatedAtDesc(Long researcherId);
    
    Optional<Questionnaire> findByIdAndResearcherId(Long id, Long researcherId);
}
