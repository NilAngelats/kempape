import "server-only";
import { serverEnvSchema, type ServerEnv } from "@/lib/server/env-schema";
export { publicEnvSchema, serverEnvSchema, parseServerEnv } from "@/lib/server/env-schema";
export type { ServerEnv } from "@/lib/server/env-schema";

let cached: ServerEnv | undefined;
export function getServerEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}
