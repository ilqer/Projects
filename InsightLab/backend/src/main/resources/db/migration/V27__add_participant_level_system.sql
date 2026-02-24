-- V27__add_participant_level_system.sql
-- Migration for Quiz Types and Participant Level system

-- Add threshold fields to questionnaires table
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS intermediate_threshold DOUBLE PRECISION;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS advanced_threshold DOUBLE PRECISION;

-- Add level field to quiz_assignments table
ALTER TABLE quiz_assignments ADD COLUMN IF NOT EXISTS level VARCHAR(32);

-- Add check constraints for thresholds
ALTER TABLE questionnaires ADD CONSTRAINT chk_intermediate_threshold 
    CHECK (intermediate_threshold IS NULL OR (intermediate_threshold >= 0 AND intermediate_threshold <= 100));

ALTER TABLE questionnaires ADD CONSTRAINT chk_advanced_threshold 
    CHECK (advanced_threshold IS NULL OR (advanced_threshold >= 0 AND advanced_threshold <= 100));

-- Add check constraint for level enum
ALTER TABLE quiz_assignments ADD CONSTRAINT chk_level 
    CHECK (level IS NULL OR level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'));

-- Add comments
COMMENT ON COLUMN questionnaires.intermediate_threshold IS 'Threshold for intermediate level (0-100), NULL means no intermediate level';
COMMENT ON COLUMN questionnaires.advanced_threshold IS 'Threshold for advanced level (0-100), NULL means no advanced level';
COMMENT ON COLUMN quiz_assignments.level IS 'Participant level determined from competency quiz score';