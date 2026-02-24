ALTER TABLE evaluation_submissions
    ADD COLUMN reviewer_status VARCHAR(20),
    ADD COLUMN reviewer_notes TEXT,
    ADD COLUMN reviewer_quality_score INTEGER,
    ADD COLUMN reviewed_at TIMESTAMP,
    ADD COLUMN reviewed_by BIGINT;

ALTER TABLE evaluation_submissions
    ADD CONSTRAINT fk_evaluation_submission_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id);
