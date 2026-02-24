package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.artifact.BugReportArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BugReportArtifactRepository extends JpaRepository<BugReportArtifact, UUID> {
}
