-- Migration V8: Create researcher_requests table
-- Created: 2025-12-01
-- Description: This migration creates the researcher_requests table for tracking
--              user requests to become researchers (role upgrade requests)

-- =====================================================================================
-- Table: researcher_requests
-- Description: Tracks user requests for researcher account privileges
-- =====================================================================================
CREATE TABLE researcher_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_researcher_requests_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Check constraint for status enum
    CONSTRAINT check_request_status CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED'
    )),

    -- Unique constraint: prevent duplicate active requests from same user
    CONSTRAINT uk_researcher_request_user_pending UNIQUE (user_id, status)
);

-- Create indexes for researcher_requests table
CREATE INDEX idx_researcher_requests_user_id ON researcher_requests(user_id);
CREATE INDEX idx_researcher_requests_status ON researcher_requests(status);
CREATE INDEX idx_researcher_requests_created_at ON researcher_requests(created_at DESC);

-- =====================================================================================
-- Comments for documentation
-- =====================================================================================
COMMENT ON TABLE researcher_requests IS 'Tracks user requests to upgrade to researcher role';
COMMENT ON COLUMN researcher_requests.status IS 'Current status of the request (PENDING, APPROVED, REJECTED)';
COMMENT ON COLUMN researcher_requests.processed_at IS 'Timestamp when the request was approved or rejected';
