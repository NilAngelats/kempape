export type AppErrorCode = "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED" | "SESSION_EXPIRED" | "PHASE_BLOCKED" | "INFRASTRUCTURE";

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message: string, public readonly status: number) { super(message); }
}

export function safeErrorResponse(error: unknown) {
  if (error instanceof AppError) return { code: error.code, message: error.message };
  return { code: "INFRASTRUCTURE" as const, message: "Kempape is temporarily unavailable." };
}
