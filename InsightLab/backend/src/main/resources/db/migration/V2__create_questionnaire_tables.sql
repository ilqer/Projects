-- V2__create_questionnaire_tables.sql
-- Migration script for Questionnaire feature

-- Create questionnaires table
CREATE TABLE IF NOT EXISTS questionnaires (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('COMPETENCY', 'BACKGROUND')),
    researcher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    questionnaire_id BIGINT NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER')),
    correct_answer TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create question_options table
CREATE TABLE IF NOT EXISTS question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create question_versions table for version history
CREATE TABLE IF NOT EXISTS question_versions (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    version INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    correct_answer TEXT,
    options_json TEXT,
    points INTEGER NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, version)
);

-- Create indexes for better performance
CREATE INDEX idx_questionnaires_researcher ON questionnaires(researcher_id);
CREATE INDEX idx_questionnaires_type ON questionnaires(type);
CREATE INDEX idx_questionnaires_active ON questionnaires(is_active);
CREATE INDEX idx_questions_questionnaire ON questions(questionnaire_id);
CREATE INDEX idx_questions_order ON questions(questionnaire_id, display_order);
CREATE INDEX idx_question_options_question ON question_options(question_id);
CREATE INDEX idx_question_options_order ON question_options(question_id, display_order);
CREATE INDEX idx_question_versions_question ON question_versions(question_id);

-- Add comments
COMMENT ON TABLE questionnaires IS 'Stores questionnaires for competency and background assessments';
COMMENT ON TABLE questions IS 'Stores individual questions within questionnaires';
COMMENT ON TABLE question_options IS 'Stores multiple choice options for questions';
COMMENT ON TABLE question_versions IS 'Stores version history of questions';

