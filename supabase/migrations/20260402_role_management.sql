-- ============================================
-- AUTO-PROMOTE FIRST USER TO ADMIN
-- ============================================

-- Function to check if this is the first user
CREATE OR REPLACE FUNCTION is_first_user()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM profiles) = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-promote first user to admin
CREATE OR REPLACE FUNCTION auto_promote_first_admin()
RETURNS trigger AS $$
BEGIN
  -- If this is the first user, make them admin
  IF (SELECT COUNT(*) FROM profiles) = 1 THEN
    NEW.role := 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-promote first user
DROP TRIGGER IF EXISTS trigger_auto_promote_first_admin ON profiles;
CREATE TRIGGER trigger_auto_promote_first_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_first_admin();

-- ============================================
-- ADMIN ROLE MANAGEMENT FUNCTIONS
-- ============================================

-- Function to change user role (admin only)
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
  
  -- Log the action
  INSERT INTO system_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    'role_changed',
    'user',
    target_user_id::text,
    jsonb_build_object('new_role', new_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION change_user_role(uuid, text) TO authenticated;

-- ============================================
-- ADMIN USER QUERIES
-- ============================================

-- Function to get all users with details (admin only)
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

-- ============================================
-- UPDATE RLS POLICIES FOR ROLE MANAGEMENT
-- ============================================

-- Only admins can update roles
CREATE POLICY "Admins can update user roles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
