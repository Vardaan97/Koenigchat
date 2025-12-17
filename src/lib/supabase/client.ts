import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return null for development/demo mode when credentials are missing
    console.warn('Supabase credentials not configured. Running in demo mode.');
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
