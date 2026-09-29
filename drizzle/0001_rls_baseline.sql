-- 0001_rls_baseline.sql
-- Row Level Security policies for GetFunnels
-- All policies use security definer helper functions with fixed search_path

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper functions (security definer, stable)
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id uuid, p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role::text = ANY(p_roles)
  );
$$;

-- ============================================================================
-- organizations
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT WITH CHECK (true); -- created via onboarding/server

CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (public.has_org_role(id, ARRAY['owner', 'admin']));

CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE USING (public.has_org_role(id, ARRAY['owner']));

-- ============================================================================
-- profiles
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Org members can read co-members' profiles (for member lists, etc.)
CREATE POLICY "profiles_select_org" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m1
      JOIN memberships m2 ON m1.org_id = m2.org_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- memberships
-- ============================================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_select" ON memberships
  FOR SELECT USING (
    public.is_org_member(org_id) OR
    user_id = auth.uid() -- users can see their own memberships
  );

CREATE POLICY "memberships_insert" ON memberships
  FOR INSERT WITH CHECK (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "memberships_update" ON memberships
  FOR UPDATE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "memberships_delete" ON memberships
  FOR DELETE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- invites
-- ============================================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select" ON invites
  FOR SELECT USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin']) OR
    (email = (SELECT email FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "invites_insert" ON invites
  FOR INSERT WITH CHECK (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "invites_update" ON invites
  FOR UPDATE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- themes
-- ============================================================================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- System themes readable by all authenticated users
CREATE POLICY "themes_select_system" ON themes
  FOR SELECT USING (
    is_system = true AND auth.role() = 'authenticated'
  );

-- Org themes follow tenant pattern
CREATE POLICY "themes_select_org" ON themes
  FOR SELECT USING (
    org_id IS NOT NULL AND public.is_org_member(org_id)
  );

CREATE POLICY "themes_insert" ON themes
  FOR INSERT WITH CHECK (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "themes_update" ON themes
  FOR UPDATE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "themes_delete" ON themes
  FOR DELETE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- templates
-- ============================================================================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- System templates readable by all authenticated users
CREATE POLICY "templates_select_system" ON templates
  FOR SELECT USING (
    is_system = true AND auth.role() = 'authenticated'
  );

-- Org templates follow tenant pattern
CREATE POLICY "templates_select_org" ON templates
  FOR SELECT USING (
    org_id IS NOT NULL AND public.is_org_member(org_id)
  );

CREATE POLICY "templates_insert" ON templates
  FOR INSERT WITH CHECK (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "templates_update" ON templates
  FOR UPDATE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "templates_delete" ON templates
  FOR DELETE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- decks
-- ============================================================================
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decks_select" ON decks
  FOR SELECT USING (
    public.is_org_member(org_id) AND deleted_at IS NULL
  );

CREATE POLICY "decks_insert" ON decks
  FOR INSERT WITH CHECK (
    public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "decks_update" ON decks
  FOR UPDATE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "decks_delete" ON decks
  FOR DELETE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- slides
-- ============================================================================
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slides_select" ON slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND decks.deleted_at IS NULL
        AND public.is_org_member(decks.org_id)
    )
  );

CREATE POLICY "slides_insert" ON slides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

CREATE POLICY "slides_update" ON slides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

CREATE POLICY "slides_delete" ON slides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin'])
    )
  );

-- ============================================================================
-- deck_versions
-- ============================================================================
ALTER TABLE deck_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deck_versions_select" ON deck_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_versions.deck_id
        AND decks.deleted_at IS NULL
        AND public.is_org_member(decks.org_id)
    )
  );

CREATE POLICY "deck_versions_insert" ON deck_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_versions.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- ============================================================================
-- sessions
-- ============================================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = sessions.deck_id
        AND public.is_org_member(decks.org_id)
    )
  );

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = sessions.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = sessions.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- ============================================================================
-- session_events
-- ============================================================================
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_events_select" ON session_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN decks d ON d.id = s.deck_id
      WHERE s.id = session_events.session_id
        AND public.is_org_member(d.org_id)
    )
  );

CREATE POLICY "session_events_insert" ON session_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN decks d ON d.id = s.deck_id
      WHERE s.id = session_events.session_id
        AND public.has_org_role(d.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

-- ============================================================================
-- ai_generations
-- ============================================================================
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_generations_select" ON ai_generations
  FOR SELECT USING (
    public.is_org_member(org_id)
  );

CREATE POLICY "ai_generations_insert" ON ai_generations
  FOR INSERT WITH CHECK (
    public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

-- ============================================================================
-- usage_counters
-- ============================================================================
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Readable by org owners/admins
CREATE POLICY "usage_counters_select" ON usage_counters
  FOR SELECT USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- Writes only via server (service context) - no direct client writes

-- ============================================================================
-- subscriptions
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Readable by org owners/admins
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- Writes only via server (service context) - no direct client writes

-- ============================================================================
-- assets
-- ============================================================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (
    public.is_org_member(org_id)
  );

CREATE POLICY "assets_insert" ON assets
  FOR INSERT WITH CHECK (
    public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "assets_update" ON assets
  FOR UPDATE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

CREATE POLICY "assets_delete" ON assets
  FOR DELETE USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- Grant usage on helper functions to authenticated role
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) TO authenticated;