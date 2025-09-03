-- Add credits fields to users table
ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 100;
ALTER TABLE users ADD COLUMN credits_last_reset TIMESTAMP(6) DEFAULT NOW();
ALTER TABLE users ADD COLUMN total_credits_earned INTEGER NOT NULL DEFAULT 100;
ALTER TABLE users ADD COLUMN total_credits_spent INTEGER NOT NULL DEFAULT 0;

-- Add indexes for efficient credit queries
CREATE INDEX idx_users_credits ON users(credits);
CREATE INDEX idx_users_credits_reset ON users(credits_last_reset);
