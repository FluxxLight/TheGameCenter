import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ngtxlrpeetsmljbylbvz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHhscnBlZXRzbWxqYnlsYnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MTUyNTksImV4cCI6MjEwODI5MTI1OX0.KW7Uy_waACBM1k4rLqdIiePJnRHJYXi3R7c25A-Eu9A';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'tgc-auth-session-v1',
  },
});
