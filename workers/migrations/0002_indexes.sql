-- Performance indexes for Prioritiz D1 database
-- Created: 2024

-- Index for faster user token lookups on priorities
CREATE INDEX IF NOT EXISTS idx_priorities_user_token ON priorities(user_token);

-- Index for faster user token lookups on todos
CREATE INDEX IF NOT EXISTS idx_todos_user_token ON todos(user_token);

-- Index for faster priority-based todo queries
CREATE INDEX IF NOT EXISTS idx_todos_priority_id ON todos(priority_id);

-- Composite index for common query pattern (user's todos by priority)
CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON todos(user_token, priority_id);

-- Index for ordering todos within a priority
CREATE INDEX IF NOT EXISTS idx_todos_order ON todos(priority_id, "order");
