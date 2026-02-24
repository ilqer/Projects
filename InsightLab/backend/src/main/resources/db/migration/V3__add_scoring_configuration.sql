-- V3__add_scoring_configuration.sql
-- Migration script for UC4-2: Scoring, Time Limits, and Passing Thresholds
-- Also creates quiz_assignments table for UC4-3: Quiz Assignment and Management

-- Add scoring configuration columns to questionnaires table
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS passing_threshold DOUBLE PRECISION;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS total_points INTEGER;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS show_correct_answers BOOLEAN DEFAULT TRUE;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT FALSE;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN DEFAULT FALSE;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT TRUE;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS grading_method VARCHAR(50) DEFAULT 'AUTOMATIC';

-- Add check constraints
ALTER TABLE questionnaires ADD CONSTRAINT chk_passing_threshold 
    CHECK (passing_threshold IS NULL OR (passing_threshold >= 0 AND passing_threshold <= 100));

ALTER TABLE questionnaires ADD CONSTRAINT chk_time_limit 
    CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0);

ALTER TABLE questionnaires ADD CONSTRAINT chk_grading_method 
    CHECK (grading_method IN ('AUTOMATIC', 'MANUAL', 'PARTIAL_CREDIT'));

-- Create index for grading method queries
CREATE INDEX IF NOT EXISTS idx_questionnaires_grading_method ON questionnaires(grading_method);

-- Add comments
COMMENT ON COLUMN questionnaires.passing_threshold IS 'Passing percentage (0-100), NULL means no threshold';
COMMENT ON COLUMN questionnaires.time_limit_minutes IS 'Time limit in minutes, NULL means no limit';
COMMENT ON COLUMN questionnaires.total_points IS 'Total points from all questions';
COMMENT ON COLUMN questionnaires.show_correct_answers IS 'Show correct answers to participants after submission';
COMMENT ON COLUMN questionnaires.randomize_questions IS 'Randomize question order for each participant';
COMMENT ON COLUMN questionnaires.randomize_options IS 'Randomize option order for MCQ questions';
COMMENT ON COLUMN questionnaires.allow_review IS 'Allow participants to review answers before submission';
COMMENT ON COLUMN questionnaires.grading_method IS 'Method for grading: AUTOMATIC, MANUAL, or PARTIAL_CREDIT';

-- Create quiz_assignments table for UC4-3: Quiz Assignment
CREATE TABLE IF NOT EXISTS quiz_assignments (
    id BIGSERIAL PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    researcher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_id BIGINT, -- Optional: link to a specific study (FK added later when studies table exists)

    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED')),

    due_date TIMESTAMP,
    max_attempts INTEGER DEFAULT 1,
    attempts_taken INTEGER DEFAULT 0,
    allow_retake BOOLEAN NOT NULL DEFAULT FALSE,

    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    completed_at TIMESTAMP,

    score DOUBLE PRECISION,
    passed BOOLEAN,

    notes TEXT,
    decline_reason TEXT
);

-- Create indexes for quiz_assignments
CREATE INDEX idx_quiz_assignments_questionnaire ON quiz_assignments(questionnaire_id);
CREATE INDEX idx_quiz_assignments_participant ON quiz_assignments(participant_id);
CREATE INDEX idx_quiz_assignments_researcher ON quiz_assignments(researcher_id);
CREATE INDEX idx_quiz_assignments_study ON quiz_assignments(study_id);
CREATE INDEX idx_quiz_assignments_status ON quiz_assignments(status);
CREATE INDEX idx_quiz_assignments_due_date ON quiz_assignments(due_date);

-- Add comments
COMMENT ON TABLE quiz_assignments IS 'Stores quiz assignments from researchers to participants';
COMMENT ON COLUMN quiz_assignments.status IS 'Assignment status: PENDING, ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED, EXPIRED';
COMMENT ON COLUMN quiz_assignments.max_attempts IS 'Maximum number of attempts allowed';
COMMENT ON COLUMN quiz_assignments.allow_retake IS 'Whether participant can retake the quiz';
COMMENT ON COLUMN quiz_assignments.score IS 'Final score in percentage (0-100)';

