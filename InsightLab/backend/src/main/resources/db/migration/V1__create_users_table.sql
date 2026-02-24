-- V1__create_users_table.sql
-- Migration script for Users table (must run first)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANT',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    reactivation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    reactivation_rejected BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_expiry TIMESTAMP,
    CHECK (role IN ('ADMIN', 'RESEARCHER', 'PARTICIPANT', 'REVIEWER'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Add comments
COMMENT ON TABLE users IS 'Stores user accounts for the artifact comparator system';
COMMENT ON COLUMN users.role IS 'User role: ADMIN, RESEARCHER, PARTICIPANT, or REVIEWER';
COMMENT ON COLUMN users.active IS 'Whether the user account is active';
COMMENT ON COLUMN users.reactivation_requested IS 'Whether the user has requested account reactivation';
COMMENT ON COLUMN users.reactivation_rejected IS 'Whether the reactivation request was rejected';

