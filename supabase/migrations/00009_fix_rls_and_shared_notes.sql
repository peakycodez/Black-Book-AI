
-- ================================================================
-- Fix shared_notes INSERT policies:
--   • Owner-authenticated path: owner_id = auth.uid()
--   • Guest path (owner_id IS NULL): allow anon, but ONLY null owner
-- The old "Authenticated users can create shared notes" policy uses
-- role 'public' and had no WITH CHECK — drop it for a cleaner set.
-- ================================================================

DROP POLICY IF EXISTS "Authenticated users can create shared notes" ON shared_notes;
DROP POLICY IF EXISTS "shared_notes_anon_insert"                     ON shared_notes;
DROP POLICY IF EXISTS "shared_notes_owner_write"                     ON shared_notes;

-- Authenticated users: own shares (read + write)
CREATE POLICY "shared_notes_auth_insert"
  ON shared_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shared_notes_auth_own"
  ON shared_notes FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Anonymous (guest sharing): may only insert rows where owner_id IS NULL
CREATE POLICY "shared_notes_anon_insert"
  ON shared_notes FOR INSERT TO anon
  WITH CHECK (owner_id IS NULL);

-- ================================================================
-- notes INSERT policy: old 'public' role policy had no WITH CHECK
-- Replace with a clean authenticated-only policy
-- ================================================================
DROP POLICY IF EXISTS "Users can create their own notes" ON notes;
CREATE POLICY "notes_authenticated_insert"
  ON notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- folders INSERT policy: same fix
-- ================================================================
DROP POLICY IF EXISTS "Users can create their own folders" ON folders;
CREATE POLICY "folders_authenticated_insert"
  ON folders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
