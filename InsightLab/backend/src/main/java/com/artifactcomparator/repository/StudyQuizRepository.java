package com.artifactcomparator.repository;

import com.artifactcomparator.model.StudyQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyQuizRepository extends JpaRepository<StudyQuiz, Long> {

    List<StudyQuiz> findByStudyIdOrderByDisplayOrderAsc(Long studyId);

    Optional<StudyQuiz> findByIdAndStudyId(Long id, Long studyId);

    boolean existsByStudyIdAndQuestionnaireId(Long studyId, Long questionnaireId);

    long countByStudyId(Long studyId);

    List<StudyQuiz> findByQuestionnaireId(Long questionnaireId);
}
