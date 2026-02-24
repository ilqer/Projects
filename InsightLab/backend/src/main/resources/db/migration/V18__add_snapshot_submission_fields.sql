ALTER TABLE evaluation_submissions
    ADD COLUMN IF NOT EXISTS snapshot_decision VARCHAR(32),
    ADD COLUMN IF NOT EXISTS snapshot_explanation TEXT,
    ADD COLUMN IF NOT EXISTS snapshot_confidence VARCHAR(32);
