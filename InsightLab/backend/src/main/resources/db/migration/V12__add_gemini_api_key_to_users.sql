-- V12__add_gemini_api_key_to_users.sql
-- Add gemini_api_key column to users table for researchers

ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

COMMENT ON COLUMN users.gemini_api_key IS 'Google Gemini API key for researchers to generate AI questions';

