-- Migration V14: Add evaluation task notification types
-- Created: 2025-12-02
-- Description: Updates notification constraints to support evaluation task notifications

-- =====================================================================================
-- Drop and recreate check_notification_type constraint with evaluation types
-- =====================================================================================
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS check_notification_type;

ALTER TABLE notifications
ADD CONSTRAINT check_notification_type CHECK (type IN (
    'TASK_ASSIGNED',
    'DEADLINE_REMINDER',
    'STUDY_INVITATION',
    'REVIEW_ASSIGNED',
    'SYSTEM_ALERT',
    'QUIZ_INVITATION',
    'QUIZ_INVITATION_ACCEPTED',
    'QUIZ_INVITATION_DECLINED',
    'QUIZ_GRADED',
    'EVALUATION_TASK_ASSIGNED',
    'EVALUATION_TASK_COMPLETED'
));

-- =====================================================================================
-- Drop and recreate check_related_entity_type constraint with EVALUATION_TASK type
-- =====================================================================================
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS check_related_entity_type;

ALTER TABLE notifications
ADD CONSTRAINT check_related_entity_type CHECK (
    related_entity_type IS NULL OR
    related_entity_type IN (
        'STUDY',
        'QUESTIONNAIRE',
        'ARTIFACT',
        'QUIZ_ASSIGNMENT',
        'REVIEW',
        'EVALUATION_TASK'
    )
);

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON CONSTRAINT check_notification_type ON notifications IS 'Valid notification types including evaluation task notifications';
COMMENT ON CONSTRAINT check_related_entity_type ON notifications IS 'Valid related entity types including evaluation tasks';
