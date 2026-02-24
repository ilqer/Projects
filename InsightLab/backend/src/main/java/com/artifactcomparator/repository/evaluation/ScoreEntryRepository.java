package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.ScoreEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreEntryRepository extends JpaRepository<ScoreEntry, Long> {

    List<ScoreEntry> findByAssignmentId(Long assignmentId);

    Optional<ScoreEntry> findByAssignmentIdAndCriteriaItemId(Long assignmentId, Long criteriaItemId);

    void deleteByAssignmentId(Long assignmentId);

    long countByAssignmentId(Long assignmentId);
}
