-- Database schema for Hotel List application
-- Creates the 'users' and 'hotels' tables with native PostgreSQL data types

-- Users table for authentication and administrative access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- Hotels table with ownership linkage and availability status
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'Available',
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on title for faster case-insensitive search
CREATE INDEX IF NOT EXISTS idx_hotels_title ON hotels (LOWER(title));

-- Index on price for fast price-range filtering
CREATE INDEX IF NOT EXISTS idx_hotels_price ON hotels (price);

-- Index on availability for status filtering
CREATE INDEX IF NOT EXISTS idx_hotels_availability ON hotels (availability_status);

-- Index on user_id for owner filtering
CREATE INDEX IF NOT EXISTS idx_hotels_user_id ON hotels (user_id);
