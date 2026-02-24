-- Migration V9: Add foreign key from artifact to studies table
-- Created: 2025-12-01
-- Description: Adds the foreign key constraint from artifact.study_id to studies.id
--              This was deferred from V5 to avoid circular dependency issues

-- =====================================================================================
-- Add foreign key constraint
-- =====================================================================================
ALTER TABLE artifact
    ADD CONSTRAINT fk_artifact_study
    FOREIGN KEY (study_id)
    REFERENCES studies(id)
    ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_artifact_study ON artifact IS 'Optional link to the study this artifact belongs to';
