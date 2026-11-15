-- Migration: 002_add_admin_and_availability.sql
-- Safe, non-destructive migration to add user roles and hotel availability

-- 1. Safely add role column to users table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- 2. Safely add availability_status column to hotels table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'hotels' AND column_name = 'availability_status'
    ) THEN
        ALTER TABLE hotels ADD COLUMN availability_status VARCHAR(20) NOT NULL DEFAULT 'Available';
    END IF;
END $$;

-- Ensure all existing hotels default to 'Available'
UPDATE hotels SET availability_status = 'Available' WHERE availability_status IS NULL;

-- 3. Index on availability_status for fast filtering
CREATE INDEX IF NOT EXISTS idx_hotels_availability ON hotels (availability_status);
