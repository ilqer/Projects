-- V11__create_reviewer_and_evaluation_tables.sql
-- Migration script for Reviewer Assignments and Participant Evaluation Reviews
-- Created: 2025-12-02
-- Description: Creates tables for reviewer assignments and participant evaluation reviews

-- =====================================================================================
-- Table: reviewer_assignments
-- Description: Tracks reviewer assignments for studies
-- =====================================================================================
CREATE TABLE reviewer_assignments (
    id BIGSERIAL PRIMARY KEY,
    study_id BIGINT NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    assigned_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    completed_at TIMESTAMP,

    decline_reason VARCHAR(500),
    reviewer_notes VARCHAR(2000),

    -- Statistics
    total_evaluations INTEGER DEFAULT 0,
    reviewed_evaluations INTEGER DEFAULT 0,
    accepted_evaluations INTEGER DEFAULT 0,
    rejected_evaluations INTEGER DEFAULT 0,
    flagged_evaluations INTEGER DEFAULT 0,

    -- Constraints
    CONSTRAINT chk_reviewer_assignment_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED'))
);

-- Create indexes for reviewer_assignments
CREATE INDEX idx_reviewer_assignments_study ON reviewer_assignments(study_id);
CREATE INDEX idx_reviewer_assignments_reviewer ON reviewer_assignments(reviewer_id);
CREATE INDEX idx_reviewer_assignments_assigned_by ON reviewer_assignments(assigned_by);
CREATE INDEX idx_reviewer_assignments_status ON reviewer_assignments(status);

-- =====================================================================================
-- Table: participant_evaluation_reviews
-- Description: Reviews of participant evaluations by assigned reviewers
-- =====================================================================================
CREATE TABLE participant_evaluation_reviews (
    id BIGSERIAL PRIMARY KEY,
    reviewer_assignment_id BIGINT NOT NULL REFERENCES reviewer_assignments(id) ON DELETE CASCADE,
    study_id BIGINT NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Participant evaluation info
    participant_code VARCHAR(100),
    artifacts_evaluated INTEGER,
    evaluation_time_minutes INTEGER,
    completeness_percentage INTEGER,

    -- Review decision
    decision VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Quality ratings (1-5)
    quality_rating INTEGER,
    consistency_rating INTEGER,
    completeness_rating INTEGER,

    -- Comments and reasons
    reviewer_comments VARCHAR(2000),
    flag_reason VARCHAR(1000),

    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT chk_evaluation_review_decision CHECK (decision IN ('PENDING', 'ACCEPTED', 'REJECTED', 'FLAGGED'))
);

-- Create indexes for participant_evaluation_reviews
CREATE INDEX idx_participant_reviews_reviewer_assignment ON participant_evaluation_reviews(reviewer_assignment_id);
CREATE INDEX idx_participant_reviews_study ON participant_evaluation_reviews(study_id);
CREATE INDEX idx_participant_reviews_participant ON participant_evaluation_reviews(participant_id);
CREATE INDEX idx_participant_reviews_reviewer ON participant_evaluation_reviews(reviewer_id);
CREATE INDEX idx_participant_reviews_decision ON participant_evaluation_reviews(decision);

-- =====================================================================================
-- Table: evaluation_review_issues
-- Description: Collection table for issues found during evaluation reviews
-- =====================================================================================
CREATE TABLE evaluation_review_issues (
    review_id BIGINT NOT NULL REFERENCES participant_evaluation_reviews(id) ON DELETE CASCADE,
    issue VARCHAR(2000)
);

-- Create index for evaluation_review_issues
CREATE INDEX idx_evaluation_review_issues_review_id ON evaluation_review_issues(review_id);

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON TABLE reviewer_assignments IS 'Assigns reviewers to studies to review participant evaluations';
COMMENT ON TABLE participant_evaluation_reviews IS 'Reviews of participant evaluations by assigned reviewers';
COMMENT ON TABLE evaluation_review_issues IS 'Issues found during evaluation reviews';

COMMENT ON COLUMN reviewer_assignments.status IS 'Assignment status: PENDING, ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED';
COMMENT ON COLUMN participant_evaluation_reviews.decision IS 'Review decision: PENDING, ACCEPTED, REJECTED, FLAGGED';
COMMENT ON COLUMN participant_evaluation_reviews.participant_code IS 'Anonymous participant code (e.g., P-00123)';
