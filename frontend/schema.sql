-- ====================================================================
-- FindIt AI - Database Schema: Rewards Wallet & Appreciation Badges
-- Compatible with PostgreSQL & Supabase (Includes RLS Policies & Indexes)
-- ====================================================================

-- 1. BADGE DEFINITIONS TABLE
CREATE TABLE IF NOT EXISTS badge_definitions (
    id VARCHAR(64) PRIMARY KEY,
    badge_name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(32) NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'milestone', -- 'milestone' or 'special'
    return_threshold INT DEFAULT 0,                    -- Required verified returns (0 for special criteria)
    criteria_rule VARCHAR(120) DEFAULT NULL,            -- e.g. 'no_reward_accepted', 'within_24_hours'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial milestone & special badges
INSERT INTO badge_definitions (id, badge_name, description, icon, category, return_threshold, criteria_rule) VALUES
('badge-first-finder', 'First Finder', 'Successfully completed 1 verified item return on campus.', '🌱', 'milestone', 1, NULL),
('badge-helping-hand', 'Helping Hand', 'Successfully completed 3 verified item returns.', '🤝', 'milestone', 3, NULL),
('badge-campus-hero', 'Campus Hero', 'Successfully completed 5 verified item returns.', '🏅', 'milestone', 5, NULL),
('badge-guardian', 'Guardian of Goodness', 'Successfully completed 10 verified item returns.', '💎', 'milestone', 10, NULL),
('badge-kindness-champ', 'Kindness Champion', 'Successfully completed 15 verified item returns.', '❤️', 'milestone', 15, NULL),
('badge-legend-honesty', 'Legend of Honesty', 'Successfully completed 25 verified item returns.', '👑', 'milestone', 25, NULL),
('badge-sharp-eye', 'Sharp Eye', 'Submitted a high-quality found-item report with clear visual tags and accurate location.', '🔍', 'special', 0, 'high_quality_report'),
('badge-selfless-soul', 'Selfless Soul', 'Completed a verified return without accepting the authorized reward.', '💖', 'special', 0, 'declined_reward'),
('badge-quick-helper', 'Quick Helper', 'Completed a verified return within 24 hours of the item being reported lost.', '⚡', 'special', 0, 'under_24_hours'),
('badge-community-star', 'Community Star', 'Received multiple verified appreciation acknowledgements from campus peers.', '🌟', 'special', 0, 'community_kudos')
ON CONFLICT (id) DO NOTHING;

-- 2. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    available_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0.00),
    total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0.00),
    total_redeemed DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_redeemed >= 0.00),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- 3. REWARDS TABLE (Item Owner Escrow/Bounty)
CREATE TABLE IF NOT EXISTS rewards (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    finder_id VARCHAR(64) DEFAULT NULL,
    item_id VARCHAR(64) NOT NULL,
    reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (reward_amount >= 0.00),
    status VARCHAR(32) NOT NULL DEFAULT 'offered', -- 'offered', 'pending_handover', 'credited', 'declined', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT check_reward_status CHECK (status IN ('offered', 'pending_handover', 'credited', 'declined', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_rewards_item_id ON rewards(item_id);
CREATE INDEX IF NOT EXISTS idx_rewards_owner_id ON rewards(owner_id);
CREATE INDEX IF NOT EXISTS idx_rewards_finder_id ON rewards(finder_id);

-- 4. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(64) PRIMARY KEY,
    wallet_id VARCHAR(64) NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(32) NOT NULL, -- 'reward_credited', 'reward_redeemed', 'pending_reward', 'reward_refunded', 'transaction_failed'
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0.00),
    reference_id VARCHAR(64) DEFAULT NULL, -- reward_id or redemption_id
    description TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_txn_type CHECK (transaction_type IN ('reward_credited', 'reward_redeemed', 'pending_reward', 'reward_refunded', 'transaction_failed')),
    CONSTRAINT check_txn_status CHECK (status IN ('completed', 'pending', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id);

-- 5. REWARD REDEMPTIONS TABLE (GoGrab Vending Integration)
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    transaction_id VARCHAR(64) NOT NULL REFERENCES wallet_transactions(id),
    redemption_token VARCHAR(64) NOT NULL UNIQUE,
    purchase_amount DECIMAL(10, 2) NOT NULL CHECK (purchase_amount >= 0.00),
    wallet_amount_used DECIMAL(10, 2) NOT NULL CHECK (wallet_amount_used >= 0.00),
    remaining_upi_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (remaining_upi_amount >= 0.00),
    vending_machine_id VARCHAR(64) DEFAULT 'GOGRAB-VM-CAMPUS-01',
    item_summary JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'issued', -- 'issued', 'dispensed', 'expired', 'failed'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT check_redemption_status CHECK (status IN ('issued', 'dispensed', 'expired', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_token ON reward_redemptions(redemption_token);

-- 6. USER ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS user_achievements (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    badge_id VARCHAR(64) NOT NULL REFERENCES badge_definitions(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id) -- Prevent duplicate badge award
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ====================================================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Wallets Policy: User can only read and manage their own wallet
CREATE POLICY user_read_own_wallet ON wallets
    FOR SELECT USING (auth.uid()::text = user_id);

-- Wallet Transactions Policy: User can read only their transactions
CREATE POLICY user_read_own_transactions ON wallet_transactions
    FOR SELECT USING (
        wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()::text)
    );

-- Reward Redemptions Policy: User can read their own redemptions
CREATE POLICY user_read_own_redemptions ON reward_redemptions
    FOR SELECT USING (auth.uid()::text = user_id);

-- Achievements Policy: Publicly readable for campus peer recognition, but insertable only by backend
CREATE POLICY public_read_achievements ON user_achievements
    FOR SELECT USING (true);
