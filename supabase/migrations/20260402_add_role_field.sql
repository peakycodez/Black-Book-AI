-- ============================================
-- ADD ROLE FIELD TO EXISTING PROFILES TABLE
-- ============================================

-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    CREATE INDEX idx_profiles_role ON profiles(role);
  END IF;
END $$;

-- Update all existing profiles to have 'user' role if NULL
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- ============================================
-- PROMOTE FIRST USER TO ADMIN
-- ============================================

-- If no admin exists, promote the first user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
    UPDATE profiles
    SET role = 'admin'
    WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;

-- Create policy for admin role updates
CREATE POLICY "Admins can update user roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- VERIFICATION
-- ============================================

-- Show current admins
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  RAISE NOTICE 'Total admins: %', admin_count;
  
  IF admin_count > 0 THEN
    RAISE NOTICE 'Admin users:';
    FOR r IN (
      SELECT u.email, p.role 
      FROM profiles p 
      JOIN auth.users u ON p.id = u.id 
      WHERE p.role = 'admin'
    ) LOOP
      RAISE NOTICE '  - %', r.email;
    END LOOP;
  ELSE
    RAISE NOTICE 'No admin users found. Please manually promote a user.';
  END IF;
END $$;
