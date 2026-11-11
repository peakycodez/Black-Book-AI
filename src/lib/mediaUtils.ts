import { isSupabaseConfigured, supabase } from '@/db/supabase';

export const MAX_LOCAL_MEDIA_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads media to Supabase Storage when online and available; falls back to a
 * persistent base64 data URL (up to MAX_LOCAL_MEDIA_BYTES) in offline/guest mode
 * so media attachments survive reloads instead of dying like blob URLs.
 */
export async function uploadMediaFile(
  file: File
): Promise<{ url: string; usedLocalFallback: boolean }> {
  const isGuestMode =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('blackbook_guest_mode') === 'true';

  if (isSupabaseConfigured) {
    try {
      let folder = 'guest';
      if (!isGuestMode) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        folder = user?.id ?? 'guest';
      }

      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from('note-media')
        .upload(path, file, { upsert: false });

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('note-media').getPublicUrl(path);
        return { url: publicUrl, usedLocalFallback: false };
      }
    } catch {
      // Fall back to persistent Data URL when cloud storage is unavailable
    }
  }

  if (file.size > MAX_LOCAL_MEDIA_BYTES) {
    throw new Error(
      'File exceeds 2MB offline limit. Connect to cloud storage or use a media URL.'
    );
  }

  const dataUrl = await readFileAsDataUrl(file);
  return { url: dataUrl, usedLocalFallback: true };
}
