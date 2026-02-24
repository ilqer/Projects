ALTER TABLE evaluation_tasks
    ADD COLUMN IF NOT EXISTS clone_original_code_content TEXT,
    ADD COLUMN IF NOT EXISTS clone_clone_code_content TEXT,
    ADD COLUMN IF NOT EXISTS bug_report_json TEXT,
    ADD COLUMN IF NOT EXISTS solid_json TEXT;
