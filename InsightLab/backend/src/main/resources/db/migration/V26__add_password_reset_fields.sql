-- Add password reset fields to users table
ALTER TABLE users
ADD COLUMN password_reset_token VARCHAR(6),
ADD COLUMN password_reset_expiry TIMESTAMP;
