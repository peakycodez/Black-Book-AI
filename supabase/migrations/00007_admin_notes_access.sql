
-- Admin can read all notes (existing notes_own is ALL but only for owner)
DROP POLICY IF EXISTS "notes_admin_select" ON notes;
CREATE POLICY "notes_admin_select"
  ON notes FOR SELECT TO authenticated
  USING (is_admin());

-- Admin can read all folders
DROP POLICY IF EXISTS "folders_admin_select" ON folders;
CREATE POLICY "folders_admin_select"
  ON folders FOR SELECT TO authenticated
  USING (is_admin());

-- Function: get all notes with owner email + folder name (admin only)
CREATE OR REPLACE FUNCTION get_all_notes_admin()
RETURNS TABLE (
  id            uuid,
  user_id       uuid,
  owner_email   text,
  folder_id     uuid,
  folder_name   text,
  title         text,
  blocks        jsonb,
  knowledge_links jsonb,
  created_at    timestamptz,
  updated_at    timestamptz
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
    n.id,
    n.user_id,
    u.email::text   AS owner_email,
    n.folder_id,
    f.name::text    AS folder_name,
    n.title,
    n.blocks,
    n.knowledge_links,
    n.created_at,
    n.updated_at
  FROM notes n
  JOIN auth.users u ON n.user_id = u.id
  LEFT JOIN folders f ON n.folder_id = f.id
  ORDER BY n.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_notes_admin() TO authenticated;
