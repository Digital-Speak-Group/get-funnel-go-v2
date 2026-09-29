-- 0000_initial_schema.sql
-- Initial schema for GetFunnels

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE status AS ENUM ('draft', 'ready', 'archived');
CREATE TYPE session_status AS ENUM ('live', 'ended');
CREATE TYPE event_type AS ENUM ('slide_view', 'deck_open', 'deck_close');
CREATE TYPE kind AS ENUM ('brief', 'plan', 'slides', 'slide', 'review');
CREATE TYPE generation_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE asset_kind AS ENUM ('logo', 'image', 'export');

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'trial',
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    locale TEXT NOT NULL DEFAULT 'fr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memberships
CREATE TABLE memberships (
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id)
);

-- Invites
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role role NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Themes
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tokens JSONB NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    theme_id UUID REFERENCES themes(id),
    slide_count INT NOT NULL,
    config JSONB NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decks
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    theme_id UUID NOT NULL REFERENCES themes(id),
    template_id UUID REFERENCES templates(id),
    status status NOT NULL DEFAULT 'draft',
    present_token TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL DEFAULT 'fr',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slides
CREATE TABLE slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    position INT NOT NULL,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    notes TEXT,
    script TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (deck_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- Deck versions
CREATE TABLE deck_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    version INT NOT NULL,
    snapshot JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (deck_id, version)
);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    presenter_id UUID NOT NULL REFERENCES profiles(id),
    status session_status NOT NULL,
    present_token TEXT NOT NULL UNIQUE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session events
CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    slide_index INT NOT NULL,
    event_type event_type NOT NULL,
    duration_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI generations
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
    kind kind NOT NULL,
    model TEXT NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    cost_cents NUMERIC(10,4) NOT NULL,
    status generation_status NOT NULL,
    error TEXT,
    duration_ms INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage counters
CREATE TABLE usage_counters (
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    ai_credits_used INT NOT NULL DEFAULT 0,
    decks_created INT NOT NULL DEFAULT 0,
    PRIMARY KEY (org_id, period_start)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    kind asset_kind NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    width INT,
    height INT,
    size_bytes INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for hot paths
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_decks_org_updated ON decks(org_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_slides_deck_position ON slides(deck_id, position);
CREATE INDEX idx_sessions_deck_status ON sessions(deck_id, status);
CREATE INDEX idx_session_events_session_created ON session_events(session_id, created_at);
CREATE INDEX idx_ai_generations_org_created ON ai_generations(org_id, created_at DESC);
CREATE INDEX idx_ai_generations_deck ON ai_generations(deck_id);
CREATE INDEX idx_decks_present_token ON decks(present_token);
CREATE INDEX idx_usage_counters_org_period ON usage_counters(org_id, period_start);