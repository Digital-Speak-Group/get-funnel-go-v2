-- 0006_rls_policies.sql
-- Row Level Security on every table: defense-in-depth behind the org-scoped repositories
-- (docs/data-model.md → RLS). Supersedes the hand-written 0001_rls_baseline.sql and
-- 0002_onboarding_rls_fix.sql (never in the migration journal; removed, see git history).
--
-- Portable and re-runnable:
-- * On Supabase, auth.uid()/auth.role() and the `authenticated` role already exist and are
--   left untouched. On plain Postgres (Docker dev, V2 VPS) equivalents are created that read
--   the same `request.jwt.claims` setting, so the policies behave identically.
-- * Every policy is dropped before it is created, so a database that already received the
--   old baseline by hand converges on this definition.
--
-- Roles that own the tables or are superusers (the server's DATABASE_URL role today)
-- bypass RLS; these policies bind `authenticated` connections (e.g. Supabase's REST API).

-- ============================================================================
-- Supabase compatibility (no-ops on Supabase)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$
      SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
    $f$;
  END IF;
  IF to_regprocedure('auth.role()') IS NULL THEN
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $f$
      SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '')::text
    $f$;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Helper functions (security definer: read memberships without recursing into its policy)
-- ============================================================================
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

GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, text[]) TO authenticated;

-- ============================================================================
-- organizations
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (public.is_org_member(id));

-- Organizations are created by the server (onboarding transaction), never by clients.
DROP POLICY IF EXISTS "organizations_insert" ON organizations;

DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (public.has_org_role(id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "organizations_delete" ON organizations;
CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE USING (public.has_org_role(id, ARRAY['owner']));

-- ============================================================================
-- profiles
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Co-members' profiles (member lists)
DROP POLICY IF EXISTS "profiles_select_org" ON profiles;
CREATE POLICY "profiles_select_org" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m1
      JOIN memberships m2 ON m1.org_id = m2.org_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
    )
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- memberships
-- ============================================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memberships_select" ON memberships;
CREATE POLICY "memberships_select" ON memberships
  FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "memberships_insert" ON memberships;
CREATE POLICY "memberships_insert" ON memberships
  FOR INSERT WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin']));

-- The old baseline let any user insert a membership for themselves (into ANY org, with any
-- role). Onboarding now writes the owner membership server-side, so that policy is dropped.
DROP POLICY IF EXISTS "memberships_insert_self" ON memberships;

DROP POLICY IF EXISTS "memberships_update" ON memberships;
CREATE POLICY "memberships_update" ON memberships
  FOR UPDATE USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "memberships_delete" ON memberships;
CREATE POLICY "memberships_delete" ON memberships
  FOR DELETE USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- invites
-- ============================================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites_select" ON invites;
CREATE POLICY "invites_select" ON invites
  FOR SELECT USING (
    public.has_org_role(org_id, ARRAY['owner', 'admin']) OR
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "invites_insert" ON invites;
CREATE POLICY "invites_insert" ON invites
  FOR INSERT WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "invites_update" ON invites;
CREATE POLICY "invites_update" ON invites
  FOR UPDATE USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- themes
-- ============================================================================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "themes_select_system" ON themes;
CREATE POLICY "themes_select_system" ON themes
  FOR SELECT USING (is_system = true AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "themes_select_org" ON themes;
CREATE POLICY "themes_select_org" ON themes
  FOR SELECT USING (org_id IS NOT NULL AND public.is_org_member(org_id));

DROP POLICY IF EXISTS "themes_insert" ON themes;
CREATE POLICY "themes_insert" ON themes
  FOR INSERT WITH CHECK (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

DROP POLICY IF EXISTS "themes_update" ON themes;
CREATE POLICY "themes_update" ON themes
  FOR UPDATE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

DROP POLICY IF EXISTS "themes_delete" ON themes;
CREATE POLICY "themes_delete" ON themes
  FOR DELETE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- templates
-- ============================================================================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_select_system" ON templates;
CREATE POLICY "templates_select_system" ON templates
  FOR SELECT USING (is_system = true AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "templates_select_org" ON templates;
CREATE POLICY "templates_select_org" ON templates
  FOR SELECT USING (org_id IS NOT NULL AND public.is_org_member(org_id));

DROP POLICY IF EXISTS "templates_insert" ON templates;
CREATE POLICY "templates_insert" ON templates
  FOR INSERT WITH CHECK (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

DROP POLICY IF EXISTS "templates_update" ON templates;
CREATE POLICY "templates_update" ON templates
  FOR UPDATE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor'])
  );

DROP POLICY IF EXISTS "templates_delete" ON templates;
CREATE POLICY "templates_delete" ON templates
  FOR DELETE USING (
    org_id IS NOT NULL AND public.has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- decks
-- ============================================================================
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decks_select" ON decks;
CREATE POLICY "decks_select" ON decks
  FOR SELECT USING (public.is_org_member(org_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "decks_insert" ON decks;
CREATE POLICY "decks_insert" ON decks
  FOR INSERT WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS "decks_update" ON decks;
CREATE POLICY "decks_update" ON decks
  FOR UPDATE USING (public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS "decks_delete" ON decks;
CREATE POLICY "decks_delete" ON decks
  FOR DELETE USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- slides
-- ============================================================================
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slides_select" ON slides;
CREATE POLICY "slides_select" ON slides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND decks.deleted_at IS NULL
        AND public.is_org_member(decks.org_id)
    )
  );

DROP POLICY IF EXISTS "slides_insert" ON slides;
CREATE POLICY "slides_insert" ON slides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

DROP POLICY IF EXISTS "slides_update" ON slides;
CREATE POLICY "slides_update" ON slides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = slides.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

DROP POLICY IF EXISTS "slides_delete" ON slides;
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

DROP POLICY IF EXISTS "deck_versions_select" ON deck_versions;
CREATE POLICY "deck_versions_select" ON deck_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_versions.deck_id
        AND decks.deleted_at IS NULL
        AND public.is_org_member(decks.org_id)
    )
  );

DROP POLICY IF EXISTS "deck_versions_insert" ON deck_versions;
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

DROP POLICY IF EXISTS "sessions_select" ON sessions;
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = sessions.deck_id
        AND public.is_org_member(decks.org_id)
    )
  );

DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = sessions.deck_id
        AND public.has_org_role(decks.org_id, ARRAY['owner', 'admin', 'editor'])
    )
  );

DROP POLICY IF EXISTS "sessions_update" ON sessions;
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

DROP POLICY IF EXISTS "session_events_select" ON session_events;
CREATE POLICY "session_events_select" ON session_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN decks d ON d.id = s.deck_id
      WHERE s.id = session_events.session_id
        AND public.is_org_member(d.org_id)
    )
  );

DROP POLICY IF EXISTS "session_events_insert" ON session_events;
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

DROP POLICY IF EXISTS "ai_generations_select" ON ai_generations;
CREATE POLICY "ai_generations_select" ON ai_generations
  FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "ai_generations_insert" ON ai_generations;
CREATE POLICY "ai_generations_insert" ON ai_generations
  FOR INSERT WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor']));

-- ============================================================================
-- usage_counters, subscriptions: read by owners/admins; written only by the server
-- ============================================================================
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_counters_select" ON usage_counters;
CREATE POLICY "usage_counters_select" ON usage_counters
  FOR SELECT USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));

-- ============================================================================
-- assets
-- ============================================================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_select" ON assets;
CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "assets_insert" ON assets;
CREATE POLICY "assets_insert" ON assets
  FOR INSERT WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS "assets_update" ON assets;
CREATE POLICY "assets_update" ON assets
  FOR UPDATE USING (public.has_org_role(org_id, ARRAY['owner', 'admin', 'editor']));

DROP POLICY IF EXISTS "assets_delete" ON assets;
CREATE POLICY "assets_delete" ON assets
  FOR DELETE USING (public.has_org_role(org_id, ARRAY['owner', 'admin']));
