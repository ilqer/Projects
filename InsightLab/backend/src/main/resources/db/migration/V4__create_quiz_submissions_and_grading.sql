-- V4__create_quiz_submissions_and_grading.sql
-- Migration script for UC4-4: Quiz Submissions and Grading

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id BIGSERIAL PRIMARY KEY,
    quiz_assignment_id BIGINT NOT NULL REFERENCES quiz_assignments(id) ON DELETE CASCADE,
    participant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    questionnaire_id BIGINT NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'RETURNED')),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP,
    auto_score DOUBLE PRECISION, -- Auto-graded score (0-100)
    manual_score DOUBLE PRECISION, -- Manually adjusted score (0-100)
    final_score DOUBLE PRECISION, -- Final score after grading (0-100)
    total_points_earned INTEGER, -- Raw points earned
    total_points_possible INTEGER, -- Total points possible
    passed BOOLEAN, -- Whether the submission passed based on threshold
    requires_manual_grading BOOLEAN NOT NULL DEFAULT FALSE,
    time_taken_minutes INTEGER, -- Actual time taken
    UNIQUE(quiz_assignment_id, attempt_number)
);

-- Create question_answers table
CREATE TABLE IF NOT EXISTS question_answers (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT, -- For short answer questions
    selected_option_ids TEXT, -- Comma-separated option IDs for MCQ (supports multiple select in future)
    is_correct BOOLEAN, -- Auto-graded result
    points_earned DOUBLE PRECISION, -- Points awarded (can be partial)
    points_possible INTEGER NOT NULL, -- Max points for this question
    requires_manual_grading BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id)
);

-- Create grading_actions table for audit logging
CREATE TABLE IF NOT EXISTS grading_actions (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_answer_id BIGINT REFERENCES question_answers(id) ON DELETE CASCADE, -- NULL for overall submission grading
    grader_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('AUTO_GRADE', 'MANUAL_GRADE', 'GRADE_ADJUSTMENT', 'FEEDBACK_ADDED', 'FINALIZED')),
    points_before DOUBLE PRECISION,
    points_after DOUBLE PRECISION,
    feedback TEXT,
    notes TEXT, -- Internal notes from grader
    graded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create grading_feedback table for detailed feedback on answers
CREATE TABLE IF NOT EXISTS grading_feedback (
    id BIGSERIAL PRIMARY KEY,
    question_answer_id BIGINT NOT NULL REFERENCES question_answers(id) ON DELETE CASCADE,
    grader_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    points_awarded DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_submissions_assignment ON quiz_submissions(quiz_assignment_id);
CREATE INDEX idx_quiz_submissions_participant ON quiz_submissions(participant_id);
CREATE INDEX idx_quiz_submissions_questionnaire ON quiz_submissions(questionnaire_id);
CREATE INDEX idx_quiz_submissions_status ON quiz_submissions(status);
CREATE INDEX idx_quiz_submissions_requires_grading ON quiz_submissions(requires_manual_grading, status);
CREATE INDEX idx_quiz_submissions_submitted_at ON quiz_submissions(submitted_at);

CREATE INDEX idx_question_answers_submission ON question_answers(submission_id);
CREATE INDEX idx_question_answers_question ON question_answers(question_id);
CREATE INDEX idx_question_answers_requires_grading ON question_answers(requires_manual_grading);

CREATE INDEX idx_grading_actions_submission ON grading_actions(submission_id);
CREATE INDEX idx_grading_actions_grader ON grading_actions(grader_id);
CREATE INDEX idx_grading_actions_type ON grading_actions(action_type);
CREATE INDEX idx_grading_actions_graded_at ON grading_actions(graded_at);

CREATE INDEX idx_grading_feedback_answer ON grading_feedback(question_answer_id);
CREATE INDEX idx_grading_feedback_grader ON grading_feedback(grader_id);

-- Add comments
COMMENT ON TABLE quiz_submissions IS 'Stores participant quiz submission attempts and their grading status';
COMMENT ON TABLE question_answers IS 'Stores individual answers to questions within a submission';
COMMENT ON TABLE grading_actions IS 'Audit log for all grading actions performed by researchers';
COMMENT ON TABLE grading_feedback IS 'Detailed feedback provided by graders on specific answers';

COMMENT ON COLUMN quiz_submissions.auto_score IS 'Auto-graded percentage score (0-100)';
COMMENT ON COLUMN quiz_submissions.manual_score IS 'Manually adjusted percentage score (0-100)';
COMMENT ON COLUMN quiz_submissions.final_score IS 'Final percentage score after all grading (0-100)';
COMMENT ON COLUMN quiz_submissions.requires_manual_grading IS 'True if submission has questions requiring manual grading';

COMMENT ON COLUMN question_answers.selected_option_ids IS 'Comma-separated list of selected option IDs for MCQ';
COMMENT ON COLUMN question_answers.requires_manual_grading IS 'True for short answer questions or when manual review needed';

COMMENT ON COLUMN grading_actions.action_type IS 'Type of grading action: AUTO_GRADE, MANUAL_GRADE, GRADE_ADJUSTMENT, FEEDBACK_ADDED, FINALIZED';
