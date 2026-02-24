package com.artifactcomparator.repository;

import com.artifactcomparator.model.GradingFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradingFeedbackRepository extends JpaRepository<GradingFeedback, Long> {

    // Find all feedback for a question answer
    List<GradingFeedback> findByQuestionAnswerIdOrderByCreatedAtDesc(Long questionAnswerId);

    // Find feedback by grader
    List<GradingFeedback> findByGraderIdOrderByCreatedAtDesc(Long graderId);

    // Find latest feedback for a question answer
    Optional<GradingFeedback> findFirstByQuestionAnswerIdOrderByCreatedAtDesc(Long questionAnswerId);

    // Count feedback entries for a question answer
    long countByQuestionAnswerId(Long questionAnswerId);
}
