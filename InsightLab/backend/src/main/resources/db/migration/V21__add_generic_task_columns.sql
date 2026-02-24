ALTER TABLE evaluation_tasks
    ADD COLUMN IF NOT EXISTS allow_highlight BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allow_annotation BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS allow_tagging BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS layout_mode VARCHAR(32) DEFAULT 'SINGLE',
    ADD COLUMN IF NOT EXISTS artifact_references JSONB,
    ADD COLUMN IF NOT EXISTS criteria_definitions JSONB;

UPDATE evaluation_tasks
SET layout_mode = COALESCE(layout_mode, 'SINGLE'),
    allow_highlight = COALESCE(allow_highlight, TRUE),
    allow_annotation = COALESCE(allow_annotation, FALSE),
    allow_tagging = COALESCE(allow_tagging, FALSE)
WHERE layout_mode IS NULL
   OR allow_highlight IS NULL
   OR allow_annotation IS NULL
   OR allow_tagging IS NULL;

ALTER TABLE evaluation_submissions
    ADD COLUMN IF NOT EXISTS answers JSONB,
    ADD COLUMN IF NOT EXISTS annotations_snapshot JSONB;
