package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.User;
import com.artifactcomparator.model.evaluation.EvaluationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationTaskRepository extends JpaRepository<EvaluationTask, Long> {

    List<EvaluationTask> findByStudyId(Long studyId);

    List<EvaluationTask> findByStatus(EvaluationTask.TaskStatus status);

    List<EvaluationTask> findByCreatedById(Long createdById);

    List<EvaluationTask> findByCreatedBy(User createdBy);

    List<EvaluationTask> findByStudyIdAndStatus(Long studyId, EvaluationTask.TaskStatus status);
}
