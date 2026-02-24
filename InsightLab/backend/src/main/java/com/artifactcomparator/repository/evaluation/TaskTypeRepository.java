package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskTypeRepository extends JpaRepository<TaskType, Long> {

    List<TaskType> findByCreatedById(Long createdById);

    List<TaskType> findByArtifactType(TaskType.ArtifactType artifactType);
}
