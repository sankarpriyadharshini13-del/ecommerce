import { createClient } from '@supabase/supabase-js';

// Service-role client: server only. Used to verify JWTs and write to Storage.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
export const BUCKET = process.env.SUPABASE_BUCKET || 'products';
