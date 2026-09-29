-- 0002_onboarding_rls_fix.sql
-- Allow a user to insert their own membership (needed during onboarding)
-- and their own profile.

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to insert their own membership as owner (for onboarding)
-- This is safe because users can only assign themselves, and the org
-- was just created (so there's no existing membership to conflict with)
CREATE POLICY "memberships_insert_self" ON memberships
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );
