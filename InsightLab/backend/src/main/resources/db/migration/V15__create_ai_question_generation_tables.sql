-- V15__create_ai_question_generation_tables.sql
-- Create tables for AI question generation job queue and drafts

-- AI Question Generation Jobs table
CREATE TABLE IF NOT EXISTS ai_question_generation_jobs (
    id BIGSERIAL PRIMARY KEY,
    researcher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    questionnaire_id BIGINT NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    number_of_questions INTEGER NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- AI Question Drafts table
CREATE TABLE IF NOT EXISTS ai_question_drafts (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES ai_question_generation_jobs(id) ON DELETE CASCADE,
    questionnaire_id BIGINT NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER')),
    correct_answer TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'EDITED', 'DISCARDED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- AI Question Draft Options table
CREATE TABLE IF NOT EXISTS ai_question_draft_options (
    id BIGSERIAL PRIMARY KEY,
    draft_id BIGINT NOT NULL REFERENCES ai_question_drafts(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_researcher ON ai_question_generation_jobs(researcher_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_questionnaire ON ai_question_generation_jobs(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_question_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_drafts_job ON ai_question_drafts(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_drafts_questionnaire ON ai_question_drafts(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_ai_drafts_status ON ai_question_drafts(status);
CREATE INDEX IF NOT EXISTS idx_ai_draft_options_draft ON ai_question_draft_options(draft_id);

-- Add comments
COMMENT ON TABLE ai_question_generation_jobs IS 'Stores AI question generation job requests and their status';
COMMENT ON TABLE ai_question_drafts IS 'Stores AI-generated questions as drafts awaiting researcher approval';
COMMENT ON TABLE ai_question_draft_options IS 'Stores options for AI-generated multiple choice and true/false questions';
