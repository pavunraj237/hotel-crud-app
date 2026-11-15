-- Migration: 001_create_users_and_ownership.sql
-- Safe, non-destructive migration to add authentication and hotel ownership

-- 1. Create users table if it does not already exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on lowercase email for fast, case-insensitive lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- 2. Safely add user_id column to hotels table if missing (preserves existing hotel records)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'hotels' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE hotels ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Index for querying hotels by owner
CREATE INDEX IF NOT EXISTS idx_hotels_user_id ON hotels (user_id);
