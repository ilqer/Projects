CREATE TABLE study_quizzes (
    id BIGSERIAL PRIMARY KEY,
    study_id BIGINT NOT NULL,
    questionnaire_id BIGINT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_study_quizzes_study FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE CASCADE,
    CONSTRAINT fk_study_quizzes_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE,
    CONSTRAINT uq_study_questionnaire UNIQUE (study_id, questionnaire_id)
);

CREATE INDEX idx_study_quizzes_study ON study_quizzes(study_id);
CREATE INDEX idx_study_quizzes_questionnaire ON study_quizzes(questionnaire_id);
