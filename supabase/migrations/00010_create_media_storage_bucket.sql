
-- Create media storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-media',
  'note-media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','audio/mpeg','audio/wav','audio/ogg','audio/webm','video/mp4','video/webm','video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','audio/mpeg','audio/wav','audio/ogg','audio/webm','video/mp4','video/webm','video/ogg'];

-- Storage RLS policies for note-media bucket
DROP POLICY IF EXISTS "media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "media_auth_upload"   ON storage.objects;
DROP POLICY IF EXISTS "media_owner_delete"  ON storage.objects;

CREATE POLICY "media_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'note-media');

CREATE POLICY "media_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'note-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'note-media' AND (storage.foldername(name))[1] = auth.uid()::text);
