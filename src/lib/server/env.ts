import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SESSION_COOKIE_SECRET: z.string().min(32),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_COOKIE_SECRET: process.env.SESSION_COOKIE_SECRET,
  });
}
