-- ========================================
-- EVALUATION TASK SUBSYSTEM
-- ========================================

-- ========================================
-- TASK TYPE CONFIGURATION
-- ========================================
CREATE TABLE IF NOT EXISTS task_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    artifact_type VARCHAR(50) NOT NULL,
    layout_mode VARCHAR(20) NOT NULL,
    comparison_mode VARCHAR(20) NOT NULL,
    description TEXT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_artifact_type CHECK (artifact_type IN ('BUG_REPORT', 'CODE_CLONE', 'SOLID_VIOLATION', 'SNAPSHOT')),
    CONSTRAINT chk_layout_mode CHECK (layout_mode IN ('TWO_PANEL', 'THREE_PANEL', 'SINGLE_PANEL')),
    CONSTRAINT chk_comparison_mode CHECK (comparison_mode IN ('TEXTUAL', 'SEMANTIC', 'VISUAL'))
);

-- ========================================
-- CRITERIA CONFIGURATION
-- ========================================
CREATE TABLE IF NOT EXISTS criteria_sets (
    id BIGSERIAL PRIMARY KEY,
    task_type_id BIGINT REFERENCES task_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS criteria_items (
    id BIGSERIAL PRIMARY KEY,
    criteria_set_id BIGINT REFERENCES criteria_sets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    criterion_type VARCHAR(50) NOT NULL,
    scale_type VARCHAR(50),
    is_required BOOLEAN DEFAULT TRUE,
    weight DOUBLE PRECISION DEFAULT 1.0,
    options JSONB,
    display_order INTEGER DEFAULT 0,

    CONSTRAINT chk_criterion_type CHECK (criterion_type IN ('SELECTION', 'RATING', 'TEXT_INPUT', 'MULTIPLE_CHOICE', 'BOOLEAN'))
);

-- ========================================
-- EVALUATION TASKS
-- ========================================
CREATE TABLE IF NOT EXISTS evaluation_tasks (
    id BIGSERIAL PRIMARY KEY,
    task_type_id BIGINT REFERENCES task_types(id),
    study_id BIGINT REFERENCES studies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT',
    due_date TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_eval_task_status CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'))
);

-- ========================================
-- ARTIFACT STORAGE (Polymorphic Base)
-- ========================================
CREATE TABLE IF NOT EXISTS evaluation_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_type VARCHAR(50) NOT NULL,
    evaluation_task_id BIGINT REFERENCES evaluation_tasks(id) ON DELETE CASCADE,
    panel_number INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_panel_number CHECK (panel_number BETWEEN 1 AND 3)
);

-- ========================================
-- ARTIFACT TYPE 1: BUG REPORTS
-- ========================================
CREATE TABLE IF NOT EXISTS bug_report_artifacts (
    id UUID PRIMARY KEY REFERENCES evaluation_artifacts(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50),
    priority VARCHAR(50),
    reporter VARCHAR(255),
    date_reported TIMESTAMP,
    correct_category VARCHAR(100),
    llm_suggested_category VARCHAR(100),
    additional_data JSONB
);

-- ========================================
-- ARTIFACT TYPE 2: CODE CLONES
-- ========================================
CREATE TABLE IF NOT EXISTS code_clone_artifacts (
    id UUID PRIMARY KEY REFERENCES evaluation_artifacts(id) ON DELETE CASCADE,
    code_snippet_1 TEXT NOT NULL,
    code_snippet_2 TEXT NOT NULL,
    language VARCHAR(50),
    correct_clone_type VARCHAR(50),
    similarity_score DOUBLE PRECISION,
    additional_data JSONB
);

-- ========================================
-- ARTIFACT TYPE 3: SOLID VIOLATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS solid_violation_artifacts (
    id UUID PRIMARY KEY REFERENCES evaluation_artifacts(id) ON DELETE CASCADE,
    code_snippet TEXT NOT NULL,
    language VARCHAR(50),
    correct_violation_type VARCHAR(50),
    llm_analysis TEXT,
    llm_suggested_fix TEXT,
    difficulty_level VARCHAR(20),
    additional_data JSONB
);

-- ========================================
-- ARTIFACT TYPE 4: SNAPSHOTS
-- ========================================
CREATE TABLE IF NOT EXISTS snapshot_artifacts (
    id UUID PRIMARY KEY REFERENCES evaluation_artifacts(id) ON DELETE CASCADE,
    reference_image_id UUID REFERENCES evaluation_artifacts(id),
    failure_image_id UUID REFERENCES evaluation_artifacts(id),
    diff_image_id UUID REFERENCES evaluation_artifacts(id),
    correct_verdict VARCHAR(50),
    test_name VARCHAR(255),
    component_name VARCHAR(255),
    additional_data JSONB
);

-- ========================================
-- TASK ASSIGNMENTS
-- ========================================
CREATE TABLE IF NOT EXISTS participant_task_assignments (
    id BIGSERIAL PRIMARY KEY,
    evaluation_task_id BIGINT REFERENCES evaluation_tasks(id) ON DELETE CASCADE,
    participant_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,

    UNIQUE(evaluation_task_id, participant_id),
    CONSTRAINT chk_assignment_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED'))
);

-- ========================================
-- ANNOTATIONS & HIGHLIGHTS
-- ========================================
CREATE TABLE IF NOT EXISTS evaluation_annotations (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES participant_task_assignments(id) ON DELETE CASCADE,
    artifact_id UUID REFERENCES evaluation_artifacts(id),
    panel_number INTEGER,
    annotation_type VARCHAR(50) DEFAULT 'HIGHLIGHT',
    content TEXT,
    start_line INTEGER,
    end_line INTEGER,
    start_offset INTEGER,
    end_offset INTEGER,
    color VARCHAR(20),
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SCORE ENTRIES
-- ========================================
CREATE TABLE IF NOT EXISTS score_entries (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES participant_task_assignments(id) ON DELETE CASCADE,
    criteria_item_id BIGINT REFERENCES criteria_items(id),
    value JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(assignment_id, criteria_item_id)
);

-- ========================================
-- EVALUATION SUBMISSIONS
-- ========================================
CREATE TABLE IF NOT EXISTS evaluation_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES participant_task_assignments(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_spent_seconds INTEGER,
    is_locked BOOLEAN DEFAULT TRUE,
    submission_data JSONB,
    validation_errors JSONB,

    UNIQUE(assignment_id)
);

-- ========================================
-- AUTOSAVE DRAFTS
-- ========================================
CREATE TABLE IF NOT EXISTS evaluation_drafts (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES participant_task_assignments(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL,
    last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(assignment_id)
);

-- ========================================
-- REVIEWER EVALUATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS reviewer_evaluations_v2 (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT REFERENCES evaluation_submissions(id),
    reviewer_id BIGINT REFERENCES users(id),
    correctness_score DOUBLE PRECISION,
    feedback TEXT,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_evaluation_tasks_study ON evaluation_tasks(study_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_tasks_status ON evaluation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_artifacts_task ON evaluation_artifacts(evaluation_task_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_artifacts_type ON evaluation_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_participant_assignments_participant ON participant_task_assignments(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_assignments_status ON participant_task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_annotations_assignment ON evaluation_annotations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_score_entries_assignment ON score_entries(assignment_id);
