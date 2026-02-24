package com.artifactcomparator.repository.evaluation;

import com.artifactcomparator.model.evaluation.artifact.SolidViolationArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SolidViolationArtifactRepository extends JpaRepository<SolidViolationArtifact, UUID> {
}
