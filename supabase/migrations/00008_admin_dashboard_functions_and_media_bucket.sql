
-- ================================================================
-- Admin Dashboard Stats Functions
-- ================================================================

-- get_user_stats: total users, verified, unverified, active today, signups today
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT jsonb_build_object(
    'total_users',       (SELECT COUNT(*) FROM auth.users),
    'verified_users',    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'unverified_users',  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NULL),
    'active_today',      (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= CURRENT_DATE),
    'signups_today',     (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_stats() TO authenticated;

-- get_notes_stats: total notes, notes created today, total shared, shared today
CREATE OR REPLACE FUNCTION get_notes_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT jsonb_build_object(
    'total_notes',   (SELECT COUNT(*) FROM notes),
    'notes_today',   (SELECT COUNT(*) FROM notes WHERE created_at >= CURRENT_DATE),
    'total_shared',  (SELECT COUNT(*) FROM shared_notes),
    'shared_today',  (SELECT COUNT(*) FROM shared_notes WHERE created_at >= CURRENT_DATE)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_notes_stats() TO authenticated;

-- ================================================================
-- system_logs table (activity log for admin dashboard)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.system_logs (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  action      text NOT NULL,
  user_id     uuid REFERENCES auth.users ON DELETE SET NULL,
  resource_type text NOT NULL DEFAULT 'system',
  details     jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_logs_admin_select" ON system_logs;
CREATE POLICY "system_logs_admin_select"
  ON system_logs FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "system_logs_admin_all" ON system_logs;
CREATE POLICY "system_logs_admin_all"
  ON system_logs FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Seed a welcome log entry so the dashboard shows something
INSERT INTO system_logs (action, resource_type, details)
VALUES ('BlackBook admin panel initialized', 'system', '{"version": "1.0.0"}'::jsonb)
ON CONFLICT DO NOTHING;
