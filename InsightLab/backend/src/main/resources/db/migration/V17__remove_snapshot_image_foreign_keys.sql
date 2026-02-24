-- ========================================
-- Fix snapshot_artifacts to allow file-based image storage
-- ========================================
-- The image IDs are stored as files on disk, not as evaluation_artifacts
-- So we need to remove the foreign key constraints

ALTER TABLE snapshot_artifacts
    DROP CONSTRAINT IF EXISTS snapshot_artifacts_reference_image_id_fkey,
    DROP CONSTRAINT IF EXISTS snapshot_artifacts_failure_image_id_fkey,
    DROP CONSTRAINT IF EXISTS snapshot_artifacts_diff_image_id_fkey;
