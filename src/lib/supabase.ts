import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

// Accept the project ref or hostname without a protocol.
if (!/^https?:\/\//i.test(supabaseUrl)) {
  // A bare project ref (no dots) — construct the full Supabase URL.
  const host = supabaseUrl.includes('.') ? supabaseUrl : `${supabaseUrl}.supabase.co`;
  supabaseUrl = `https://${host}`;
}

/** The sole browser-safe Supabase client for CHEMLAB. */
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
