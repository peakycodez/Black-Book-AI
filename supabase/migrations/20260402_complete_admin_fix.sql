-- ============================================
-- COMPLETE ADMIN SYSTEM FIX
-- ============================================

-- PART 1: Add role column to profiles table
DO $$ 
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    CREATE INDEX idx_profiles_role ON profiles(role);
    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    RAISE NOTICE 'Role column already exists';
  END IF;
END $$;

-- Set all existing profiles to 'user' if role is NULL
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- PART 2: Set founder account as admin
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'sairajpingale2006@gmail.com'
);

-- Verify founder was set
DO $$
DECLARE
  founder_role text;
BEGIN
  SELECT role INTO founder_role
  FROM profiles
  WHERE id = (SELECT id FROM auth.users WHERE email = 'sairajpingale2006@gmail.com');
  
  IF founder_role = 'admin' THEN
    RAISE NOTICE 'SUCCESS: sairajpingale2006@gmail.com is now admin';
  ELSE
    RAISE WARNING 'FAILED: Could not set sairajpingale2006@gmail.com as admin. User may not exist yet.';
  END IF;
END $$;

-- PART 3: Create is_admin() function for access control
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
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

-- PART 4: Create function to change user roles (admin only)
CREATE OR REPLACE FUNCTION change_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin';
  END IF;
  
  -- Prevent last admin from being demoted
  IF new_role = 'user' THEN
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin') = 1 THEN
      IF (SELECT role FROM profiles WHERE id = target_user_id) = 'admin' THEN
        RAISE EXCEPTION 'Cannot demote the last admin';
      END IF;
    END IF;
  END IF;
  
  -- Update role
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;
  
  RAISE NOTICE 'User role changed to %', new_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION change_user_role(uuid, text) TO authenticated;

-- PART 5: Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view all users';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    u.email,
    p.role,
    u.email_confirmed_at,
    u.created_at,
    u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- PART 6: Update RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admins can update any profile including roles
CREATE POLICY "Admins can update user roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- PART 7: Verification
DO $$
DECLARE
  admin_count integer;
  founder_exists boolean;
BEGIN
  -- Count admins
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  -- Check if founder is admin
  SELECT EXISTS(
    SELECT 1 FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.email = 'sairajpingale2006@gmail.com' AND p.role = 'admin'
  ) INTO founder_exists;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'ADMIN SYSTEM SETUP COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total admins: %', admin_count;
  RAISE NOTICE 'Founder (sairajpingale2006@gmail.com) is admin: %', founder_exists;
  RAISE NOTICE '';
  
  IF admin_count > 0 THEN
    RAISE NOTICE 'Admin users:';
    FOR r IN (
      SELECT u.email, p.role, p.created_at
      FROM profiles p 
      JOIN auth.users u ON p.id = u.id 
      WHERE p.role = 'admin'
      ORDER BY p.created_at
    ) LOOP
      RAISE NOTICE '  - % (joined: %)', r.email, r.created_at;
    END LOOP;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Log out and log back in as sairajpingale2006@gmail.com';
  RAISE NOTICE '2. Look for "Admin Panel" button in the UI';
  RAISE NOTICE '3. Click to access the admin dashboard';
  RAISE NOTICE '===========================================';
END $$;
