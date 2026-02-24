-- V10__add_artifact_tags.sql
-- Migration script for UC2-5: Artifact Tags and Classification

-- Enable required extensions for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),  -- hex color code like #FF5733
    description TEXT,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, created_by)
);

-- Create artifact_tags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS artifact_tags (
    id BIGSERIAL PRIMARY KEY,
    artifact_id UUID NOT NULL REFERENCES artifact(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(artifact_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags(created_by);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_artifact_tags_artifact ON artifact_tags(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_tags_tag ON artifact_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_artifact_tags_combined ON artifact_tags(artifact_id, tag_id);

-- Create trigram index for tag names (fuzzy search)
CREATE INDEX IF NOT EXISTS idx_tags_name_trgm
    ON tags USING gin (name gin_trgm_ops);
