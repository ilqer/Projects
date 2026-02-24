-- V16: Create AI Artifact Generation Tables

CREATE TABLE ai_artifact_generation_jobs (
    id BIGSERIAL PRIMARY KEY,
    researcher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    programming_language VARCHAR(50) NOT NULL,
    complexity VARCHAR(20) NOT NULL,
    include_comments BOOLEAN DEFAULT FALSE,
    follow_best_practices BOOLEAN DEFAULT FALSE,
    add_error_handling BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_artifact_jobs_researcher ON ai_artifact_generation_jobs(researcher_id);
CREATE INDEX idx_ai_artifact_jobs_status ON ai_artifact_generation_jobs(status);
CREATE INDEX idx_ai_artifact_jobs_created ON ai_artifact_generation_jobs(created_at DESC);

CREATE TABLE ai_artifact_drafts (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES ai_artifact_generation_jobs(id) ON DELETE CASCADE,
    researcher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    programming_language VARCHAR(50),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_artifact_drafts_job ON ai_artifact_drafts(job_id);
CREATE INDEX idx_ai_artifact_drafts_researcher ON ai_artifact_drafts(researcher_id);
CREATE INDEX idx_ai_artifact_drafts_status ON ai_artifact_drafts(status);
CREATE INDEX idx_ai_artifact_drafts_created ON ai_artifact_drafts(created_at DESC);
