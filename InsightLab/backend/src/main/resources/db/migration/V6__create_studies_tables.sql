-- Migration V5: Create studies, study_artifacts, study_enrollments, and evaluation_criteria tables
-- Created: 2025-12-01
-- Description: This migration creates the core study management tables for research studies,
--              artifact assignments, participant enrollments, and evaluation criteria

-- =====================================================================================
-- Table: studies
-- Description: Core research study management table
-- =====================================================================================
CREATE TABLE studies (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objective TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    researcher_id BIGINT NOT NULL,
    comparison_type VARCHAR(100),
    blinded_mode BOOLEAN DEFAULT FALSE,
    max_participants INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_studies_researcher FOREIGN KEY (researcher_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Check constraint for status enum
    CONSTRAINT check_study_status CHECK (status IN (
        'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'
    ))
);

-- Create indexes for studies table
CREATE INDEX idx_studies_researcher_id ON studies(researcher_id);
CREATE INDEX idx_studies_status ON studies(status);
CREATE INDEX idx_studies_start_date ON studies(start_date);
CREATE INDEX idx_studies_end_date ON studies(end_date);

-- =====================================================================================
-- Table: study_artifacts
-- Description: Junction table linking studies to artifacts with display metadata
-- =====================================================================================
CREATE TABLE study_artifacts (
    id BIGSERIAL PRIMARY KEY,
    study_id BIGINT NOT NULL,
    artifact_id UUID NOT NULL,
    display_order INTEGER DEFAULT 0,
    display_label VARCHAR(255),
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_study_artifacts_study FOREIGN KEY (study_id)
        REFERENCES studies(id) ON DELETE CASCADE,
    CONSTRAINT fk_study_artifacts_artifact FOREIGN KEY (artifact_id)
        REFERENCES artifact(id) ON DELETE CASCADE,

    -- Unique constraint: prevent duplicate artifact assignments to same study
    CONSTRAINT uk_study_artifact UNIQUE (study_id, artifact_id)
);

-- Create indexes for study_artifacts table
CREATE INDEX idx_study_artifacts_study_id ON study_artifacts(study_id);
CREATE INDEX idx_study_artifacts_artifact_id ON study_artifacts(artifact_id);
CREATE INDEX idx_study_artifacts_display_order ON study_artifacts(study_id, display_order);

-- =====================================================================================
-- Table: study_enrollments
-- Description: Tracks participant enrollment and completion status in studies
-- =====================================================================================
CREATE TABLE study_enrollments (
    id BIGSERIAL PRIMARY KEY,
    study_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ENROLLED',
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_study_enrollments_study FOREIGN KEY (study_id)
        REFERENCES studies(id) ON DELETE CASCADE,
    CONSTRAINT fk_study_enrollments_participant FOREIGN KEY (participant_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Unique constraint: prevent duplicate enrollments
    CONSTRAINT uk_study_participant UNIQUE (study_id, participant_id),

    -- Check constraint for status enum
    CONSTRAINT check_enrollment_status CHECK (status IN (
        'INVITED', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED'
    ))
);

-- Create indexes for study_enrollments table
CREATE INDEX idx_study_enrollments_study_id ON study_enrollments(study_id);
CREATE INDEX idx_study_enrollments_participant_id ON study_enrollments(participant_id);
CREATE INDEX idx_study_enrollments_status ON study_enrollments(status);
CREATE INDEX idx_study_enrollments_enrolled_at ON study_enrollments(enrolled_at);

-- =====================================================================================
-- Table: evaluation_criteria
-- Description: Defines evaluation criteria for study artifacts
-- =====================================================================================
CREATE TABLE evaluation_criteria (
    id BIGSERIAL PRIMARY KEY,
    study_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rating_format VARCHAR(50) NOT NULL DEFAULT 'FIVE_STAR',
    rating_options TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_evaluation_criteria_study FOREIGN KEY (study_id)
        REFERENCES studies(id) ON DELETE CASCADE,

    -- Check constraint for rating format enum
    CONSTRAINT check_rating_format CHECK (rating_format IN (
        'FIVE_STAR', 'TEN_POINT', 'BINARY', 'MULTIPLE_CHOICE', 'TEXT'
    ))
);

-- Create indexes for evaluation_criteria table
CREATE INDEX idx_evaluation_criteria_study_id ON evaluation_criteria(study_id);
CREATE INDEX idx_evaluation_criteria_display_order ON evaluation_criteria(study_id, display_order);

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON TABLE studies IS 'Research studies created by researchers';
COMMENT ON TABLE study_artifacts IS 'Links artifacts to studies with display metadata';
COMMENT ON TABLE study_enrollments IS 'Tracks participant enrollment in studies';
COMMENT ON TABLE evaluation_criteria IS 'Evaluation criteria defined for study artifacts';

COMMENT ON COLUMN studies.blinded_mode IS 'Whether participants should be blinded to artifact identities';
COMMENT ON COLUMN studies.max_participants IS 'Maximum number of participants allowed in the study';
COMMENT ON COLUMN study_artifacts.display_label IS 'Optional label shown to participants (e.g., "Version A")';
COMMENT ON COLUMN evaluation_criteria.rating_options IS 'JSON or comma-separated values for custom rating options';
