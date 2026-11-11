-- ================================================================
-- Allow anonymous (guest) uploads strictly within the 'guest/' folder
-- of the note-media bucket.
--
-- Security rules:
-- 1. Restricted strictly to bucket_id = 'note-media'
-- 2. Scoped exclusively to the 'guest/' path prefix
-- 3. Anonymous users cannot DELETE or UPDATE any objects
-- 4. Bucket-level 50MB file size limit and MIME whitelist are enforced
-- 5. Authenticated users continue using their UID-prefixed folders
-- ================================================================

DROP POLICY IF EXISTS "media_guest_upload" ON storage.objects;

CREATE POLICY "media_guest_upload"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'note-media'
    AND (storage.foldername(name))[1] = 'guest'
  );
