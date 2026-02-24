-- Migration V6: Create artifact table
-- Created: 2025-12-01
-- Description: This migration creates the artifact table for storing uploaded files
--              with metadata including dimensions, checksums, and ownership tracking

-- =====================================================================================
-- Table: artifact
-- Description: Stores uploaded files and documents with metadata
-- =====================================================================================
CREATE TABLE artifact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    size_bytes BIGINT NOT NULL,
    sha256 VARCHAR(64),

    -- Optional metadata for images
    width INTEGER,
    height INTEGER,

    -- Optional metadata for PDFs
    page_count INTEGER,

    -- Ownership and timestamps
    uploaded_by_id BIGINT,
    study_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_artifact_uploaded_by FOREIGN KEY (uploaded_by_id)
        REFERENCES users(id) ON DELETE SET NULL
    -- Note: FK to studies table will be added in V9 after studies table is created
);

-- Create indexes for artifact table
CREATE INDEX idx_artifact_uploaded_by_id ON artifact(uploaded_by_id);
CREATE INDEX idx_artifact_study_id ON artifact(study_id);
CREATE INDEX idx_artifact_created_at ON artifact(created_at);
CREATE INDEX idx_artifact_content_type ON artifact(content_type);
CREATE INDEX idx_artifact_sha256 ON artifact(sha256);

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON TABLE artifact IS 'Stores uploaded files and documents with metadata';
COMMENT ON COLUMN artifact.original_filename IS 'Original filename as uploaded by user';
COMMENT ON COLUMN artifact.stored_filename IS 'Filename as stored on server/storage';
COMMENT ON COLUMN artifact.sha256 IS 'SHA-256 checksum for file integrity verification';
COMMENT ON COLUMN artifact.width IS 'Image width in pixels (for image files)';
COMMENT ON COLUMN artifact.height IS 'Image height in pixels (for image files)';
COMMENT ON COLUMN artifact.page_count IS 'Number of pages (for PDF files)';
