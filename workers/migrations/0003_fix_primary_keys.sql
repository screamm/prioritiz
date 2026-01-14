-- Migration: 0003_fix_primary_keys
-- Description: Change primary keys to composite (id, user_token) to allow
-- same IDs across different users (e.g., "must-do" for multiple users)

-- Disable foreign keys temporarily
PRAGMA foreign_keys=OFF;

-- Create new priorities table with composite primary key
CREATE TABLE priorities_new (
    id TEXT NOT NULL,
    user_token TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (id, user_token),
    FOREIGN KEY (user_token) REFERENCES users(token) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO priorities_new SELECT * FROM priorities;

-- Drop old table and rename new one
DROP TABLE priorities;
ALTER TABLE priorities_new RENAME TO priorities;

-- Create new todos table with composite primary key
CREATE TABLE todos_new (
    id TEXT NOT NULL,
    user_token TEXT NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority_id TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (id, user_token),
    FOREIGN KEY (user_token) REFERENCES users(token) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO todos_new SELECT * FROM todos;

-- Drop old table and rename new one
DROP TABLE todos;
ALTER TABLE todos_new RENAME TO todos;

-- Re-enable foreign keys
PRAGMA foreign_keys=ON;

-- Recreate indexes with new composite structure
DROP INDEX IF EXISTS idx_priorities_user_token;
DROP INDEX IF EXISTS idx_todos_user_token;
DROP INDEX IF EXISTS idx_todos_priority_id;
DROP INDEX IF EXISTS idx_todos_user_priority;
DROP INDEX IF EXISTS idx_todos_order;

CREATE INDEX idx_priorities_user_token ON priorities(user_token);
CREATE INDEX idx_todos_user_token ON todos(user_token);
CREATE INDEX idx_todos_priority_id ON todos(priority_id);
CREATE INDEX idx_todos_user_priority ON todos(user_token, priority_id);
CREATE INDEX idx_todos_order ON todos(user_token, "order");
