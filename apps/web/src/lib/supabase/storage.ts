import { createClient } from './client';

export type StorageBucket =
  | 'avatars'
  | 'covers'
  | 'articles'
  | 'businesses'
  | 'forum'
  | 'voices'
  | 'events'
  | 'classifieds';

/**
 * Upload an image to Supabase Storage.
 * Files are stored under `{userId}/{timestamp}-{filename}` to avoid collisions.
 */
export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  userId: string
): Promise<{ path: string; publicUrl: string } | { error: string }> {
  const supabase = createClient();
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return { path, publicUrl: urlData.publicUrl };
}

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return {};
}
