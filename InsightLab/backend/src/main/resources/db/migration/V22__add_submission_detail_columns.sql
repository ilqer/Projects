ALTER TABLE evaluation_submissions
    ADD COLUMN IF NOT EXISTS clone_relationship VARCHAR(50),
    ADD COLUMN IF NOT EXISTS clone_similarity DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS clone_notes TEXT,
    ADD COLUMN IF NOT EXISTS bug_severity VARCHAR(32),
    ADD COLUMN IF NOT EXISTS bug_reproducible VARCHAR(32),
    ADD COLUMN IF NOT EXISTS bug_category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS bug_notes TEXT,
    ADD COLUMN IF NOT EXISTS solid_violated_principle VARCHAR(128),
    ADD COLUMN IF NOT EXISTS solid_violation_severity VARCHAR(32),
    ADD COLUMN IF NOT EXISTS solid_explanation TEXT,
    ADD COLUMN IF NOT EXISTS solid_suggested_fix TEXT;
