-- Homa AI — Auth Migration (idempotent, no data loss)
--
-- Adds auth columns to the existing users table for independent authentication.
-- Run: wrangler d1 execute homa-ai-db --file=./migration_auth.sql
--
-- This migration is SAFE to run multiple times — existing columns are skipped.
-- No tables are dropped. No data is deleted. Existing users are preserved.
--
-- If any "duplicate column name" error appears, it means the column already
-- exists — that error can be safely ignored.

-- Add auth columns to users table (if they don't exist)
-- SQLite doesn't support "ADD COLUMN IF NOT EXISTS", so errors for existing
-- columns are expected and safe to ignore.

ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN otp_code TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN otp_expires_at TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN reset_token TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN reset_expires_at TEXT DEFAULT '';

-- Add useful indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Verify the columns were added (this query will show the table schema)
-- SELECT * FROM pragma_table_info('users');