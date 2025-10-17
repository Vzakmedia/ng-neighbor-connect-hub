const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

/**
 * Get or create Supabase client with service role key
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }
  return supabaseClient;
}

module.exports = { getSupabaseClient };
