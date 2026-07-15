import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/server/env";

let client: SupabaseClient | undefined;
export function getPrivilegedDatabase(): SupabaseClient {
  if (!client) {
    const env = getServerEnv();
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
  }
  return client;
}
