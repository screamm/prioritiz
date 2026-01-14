-- Prioritiz Database Schema
-- Migration: 0001_initial
-- Description: Creates the initial database schema for users, priorities, and todos

-- Users table
-- Stores user information identified by their unique token
CREATE TABLE IF NOT EXISTS users (
    token TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    last_sync_at INTEGER,
    email TEXT
);

-- Priorities table
-- Stores priority levels that users can create and customize
CREATE TABLE IF NOT EXISTS priorities (
    id TEXT PRIMARY KEY,
    user_token TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_token) REFERENCES users(token) ON DELETE CASCADE
);

-- Todos table
-- Stores individual todo items belonging to users
CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    user_token TEXT NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority_id TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_token) REFERENCES users(token) ON DELETE CASCADE,
    FOREIGN KEY (priority_id) REFERENCES priorities(id) ON DELETE SET NULL
);
