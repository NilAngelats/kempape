# Kempape MVP

Private, mobile-first festival companion built with Next.js, strict TypeScript, Supabase PostgreSQL, Zod and Vitest.

## Local setup

1. Copy `.env.example` to `.env.local` and supply local-only secrets of at least 32 random characters.
2. Install dependencies with `npm install`.
3. Start local Supabase with `npx supabase start` and apply the local schema with `npx supabase db reset`.
4. Create the development run, player and one-time invite with `npm run seed:dev`.
5. Start the app with `npm run dev`.

The seed command refuses production by default and never persists a raw invite code. Do not run linked database push, reset, repair or seed operations without explicit review.

Validation: `npm run check` and `git diff --check`.

See [docs/INDEX.md](docs/INDEX.md) for canonical rules and [Handoff 1 implementation](docs/implementation/HANDOFF_01_FOUNDATION_AUTH.md) for the implemented foundation.
