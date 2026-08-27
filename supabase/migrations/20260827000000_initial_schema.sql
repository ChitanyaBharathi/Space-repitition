-- MindForge Initial Database Schema Migration
-- Migration Timestamp: 2026-08-27 00:00:00 UTC

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Decks Table
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cards Table
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    ease_factor REAL DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    repetition_count INT DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    state VARCHAR(16) DEFAULT 'new', -- 'new', 'learning', 'review', 'relearning'
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_user_deck_due ON cards (user_id, deck_id, due_date);

-- 3. Review Logs Table
CREATE TABLE IF NOT EXISTS review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 4),
    review_duration_ms INT NOT NULL DEFAULT 0,
    scheduled_interval INT NOT NULL DEFAULT 0,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_logs_user_date ON review_logs (user_id, reviewed_at);

-- 4. Player Profiles Table
CREATE TABLE IF NOT EXISTS player_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    max_hp INT DEFAULT 100,
    current_hp INT DEFAULT 100,
    gold INT DEFAULT 0,
    inventory JSONB DEFAULT '[]'::jsonb,
    streak_count INT DEFAULT 0,
    last_active_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Setup
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Owner-only Policies
DROP POLICY IF EXISTS decks_owner_policy ON decks;
CREATE POLICY decks_owner_policy ON decks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS cards_owner_policy ON cards;
CREATE POLICY cards_owner_policy ON cards
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS review_logs_owner_policy ON review_logs;
CREATE POLICY review_logs_owner_policy ON review_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS player_profiles_owner_policy ON player_profiles;
CREATE POLICY player_profiles_owner_policy ON player_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
