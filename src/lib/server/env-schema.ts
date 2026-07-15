import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Kempape"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20).optional(),
});
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"), APP_URL: z.string().url(), SUPABASE_URL: z.string().url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), INVITE_CODE_HASH_SECRET: z.string().min(32), SESSION_TOKEN_HASH_SECRET: z.string().min(32), RATE_LIMIT_HASH_SECRET: z.string().min(32), SESSION_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default("kempape_session"), SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30), INTERNAL_JOB_SECRET: z.string().min(32).optional(),
});
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export function parseServerEnv(input:Record<string,unknown>){return serverEnvSchema.safeParse(input)}
