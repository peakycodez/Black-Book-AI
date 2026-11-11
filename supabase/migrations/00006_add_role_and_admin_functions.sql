
-- ============================================================
-- ADD role COLUMN TO profiles (existing table, real schema)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND column_name = 'role'
    AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Backfill any NULLs
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- ============================================================
-- SECURITY DEFINER: is_admin() — no RLS self-loop
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS ON profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_admin_select"    ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update"    ON profiles;

-- Own profile: read
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Own profile: insert (for manual backfills)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Own profile: update (non-role fields only, role protected by admin policy)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin: read all profiles
CREATE POLICY "profiles_admin_select"
  ON profiles FOR SELECT TO authenticated
  USING (is_admin());

-- Admin: update any profile (including role)
CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- RLS ON folders / notes (ensure enabled)
-- ============================================================
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;

-- folders
DROP POLICY IF EXISTS "folders_own" ON folders;
CREATE POLICY "folders_own" ON folders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notes
DROP POLICY IF EXISTS "notes_own" ON notes;
CREATE POLICY "notes_own" ON notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shared_notes: public read by share_id, owner write
DROP POLICY IF EXISTS "shared_notes_public_read"  ON shared_notes;
DROP POLICY IF EXISTS "shared_notes_owner_write"  ON shared_notes;
DROP POLICY IF EXISTS "shared_notes_anon_insert"  ON shared_notes;
DROP POLICY IF EXISTS "shared_notes_admin_all"    ON shared_notes;

CREATE POLICY "shared_notes_public_read"
  ON shared_notes FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "shared_notes_owner_write"
  ON shared_notes FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "shared_notes_anon_insert"
  ON shared_notes FOR INSERT TO anon
  WITH CHECK (owner_id IS NULL);

CREATE POLICY "shared_notes_admin_all"
  ON shared_notes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- ADMIN FUNCTIONS
-- ============================================================

-- Get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.role,
    u.email_confirmed_at,
    u.created_at,
    u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- Change user role (admin only)
CREATE OR REPLACE FUNCTION change_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: must be user or admin';
  END IF;
  IF new_role = 'user'
     AND (SELECT role FROM profiles WHERE id = target_user_id) = 'admin'
     AND (SELECT COUNT(*) FROM profiles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot demote the last admin';
  END IF;
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION change_user_role(uuid, text) TO authenticated;

-- ============================================================
-- BACKFILL + SET FOUNDER ADMIN
-- ============================================================

-- Backfill profiles for any auth users that don't have one yet
INSERT INTO profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Set founder as admin
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'sairajpingale2006@gmail.com'
  LIMIT 1
);
