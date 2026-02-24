package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.CriteriaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CriteriaItemRepository extends JpaRepository<CriteriaItem, Long> {

    List<CriteriaItem> findByCriteriaSetIdOrderByDisplayOrder(Long criteriaSetId);

    @Query("SELECT ci FROM CriteriaItem ci WHERE ci.criteriaSet.taskType.id = :taskTypeId ORDER BY ci.displayOrder")
    List<CriteriaItem> findByTaskTypeId(Long taskTypeId);

    @Query("SELECT ci FROM CriteriaItem ci WHERE ci.criteriaSet.taskType.id = :taskTypeId AND ci.isRequired = true ORDER BY ci.displayOrder")
    List<CriteriaItem> findByTaskTypeIdAndIsRequiredTrue(Long taskTypeId);
}
