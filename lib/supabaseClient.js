import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create regular Supabase client (for client-side use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin Supabase client (for server-side API routes - bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
   auth: {
      autoRefreshToken: false,
      persistSession: false,
   },
});

// Factory: create a fresh admin client per request.
// Uses cache:'no-store' on every internal fetch to bypass Next.js's automatic
// data-cache, which would otherwise return stale Supabase responses after mutations.
export function getSupabaseAdmin() {
   return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
         fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' })
      }
   });
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
   return Boolean(supabaseUrl && supabaseAnonKey);
};

// Helper function to check if admin client is configured
export const isSupabaseAdminConfigured = () => {
   return Boolean(supabaseUrl && supabaseServiceRoleKey);
};

// Helper function to format API errors
export const formatSupabaseError = (error) => {
   if (!error) return null;

   if (error.message) return error.message;
   if (error.details) return error.details;
   if (typeof error === 'string') return error;

   return 'An unexpected error occurred';
};
