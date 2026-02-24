package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.CriteriaSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CriteriaSetRepository extends JpaRepository<CriteriaSet, Long> {

    List<CriteriaSet> findByTaskTypeId(Long taskTypeId);
}
