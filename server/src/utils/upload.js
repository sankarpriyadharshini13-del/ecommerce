import multer from 'multer';
import crypto from 'node:crypto';
import { supabase, BUCKET } from '../lib/supabase.js';
import { HttpError } from './errors.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new HttpError(400, 'Only image files are allowed')),
});

// Uploads multer files to Supabase Storage, returns [{ url, path }]
export async function uploadImages(files = []) {
  const out = [];
  for (const file of files) {
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const path = `products/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    // Try to create bucket if it doesn't exist
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === BUCKET);
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
        if (createError && !createError.message.includes('already exists')) {
          throw new HttpError(500, `Failed to create storage bucket: ${createError.message}`);
        }
      }
    } catch (e) {
      // If bucket creation fails, try the upload anyway
      console.warn('Bucket check failed:', e.message);
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new HttpError(500, `Image upload failed: ${error.message}. Please create a bucket named "${BUCKET}" in Supabase Storage.`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    out.push({ url: data.publicUrl, path });
  }
  return out;
}

export async function deleteImages(paths = []) {
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
