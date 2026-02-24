ALTER TABLE evaluation_tasks
    ADD COLUMN blinded_mode BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN blinded_order JSONB;
