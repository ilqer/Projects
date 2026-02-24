-- Migration V7: Create notifications table
-- Created: 2025-12-01
-- Description: This migration creates the notifications table for user notifications
--              including study invitations, task assignments, and system alerts

-- =====================================================================================
-- Table: notifications
-- Description: Stores user notifications with read status tracking
-- =====================================================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    sender_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,

    -- Optional references to related entities
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,

    -- Foreign key constraints
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_sender FOREIGN KEY (sender_id)
        REFERENCES users(id) ON DELETE SET NULL,

    -- Check constraint for notification type enum
    CONSTRAINT check_notification_type CHECK (type IN (
        'TASK_ASSIGNED',
        'DEADLINE_REMINDER',
        'STUDY_INVITATION',
        'REVIEW_ASSIGNED',
        'SYSTEM_ALERT',
        'QUIZ_INVITATION',
        'QUIZ_INVITATION_ACCEPTED',
        'QUIZ_INVITATION_DECLINED',
        'QUIZ_GRADED'
    )),

    -- Check constraint for related entity type enum
    CONSTRAINT check_related_entity_type CHECK (
        related_entity_type IS NULL OR
        related_entity_type IN ('STUDY', 'QUESTIONNAIRE', 'ARTIFACT', 'QUIZ_ASSIGNMENT', 'REVIEW')
    )
);

-- Create indexes for notifications table
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX idx_notifications_related_entity ON notifications(related_entity_type, related_entity_id);

-- Composite index for common query: unread notifications for a user
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, read_status, sent_at DESC)
    WHERE read_status = FALSE;

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON TABLE notifications IS 'User notifications for tasks, invitations, and alerts';
COMMENT ON COLUMN notifications.read_status IS 'Whether the notification has been read by the recipient';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of entity this notification relates to (if any)';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity (for navigation)';
