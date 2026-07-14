# Repository audit

Audit date: 2026-07-15. Inspected tracked application, database, tests, docs, public assets, Git status/history; `node_modules` and generated output were identified but not source-reviewed.

| Area | Finding | Status |
|---|---|---|
| Application | Single Next.js 16.2.10 App Router app, React 19.2.7, strict TypeScript 5.9 | Scaffolded |
| UI/server | placeholder pages/nav and `/api/health`; Zod/env parser | Scaffolded |
| Rules | constants for timing, XP, Actions, Quests, items/effects, economy, Chests, Wheel | Partial; some pre-correction constants conflict |
| Database | PostgreSQL/Supabase initial migration and seed | Pre-freeze scaffold; not safe unchanged |
| Auth/realtime/PWA/jobs | dependencies/tables only or absent | Missing |
| Tests | one Vitest rule-integrity suite | Partial; Level-40 test reflects superseded rule |
| Deployment | Next build, no committed CI/platform config | Unconfirmed |

npm is the package manager. There is no ORM, lint command, state library, PWA or production gameplay command. `.next`, `tsconfig.tsbuildinfo`, coverage and secrets are not source.

The initial migration lacks `game_run_id`, RLS, transactional commands, game runs, Chaos attacks, notifications and audit completeness. Its Action status/`expires_at` shape aligns partly with the July 15 correction, but other constraints and processing are incomplete. If it has never been applied to an important database it may be replaced before first deployment. If applied to shared/persistent state, never rewrite history; add forward corrective migrations. Repository files do not prove remote application state.

Assets: 98 files—97 valid PNGs by signature (96 at 1254×1254; character template 398×655) and one valid 1200×675, 15-frame GIF. No byte-identical duplicates. Missing manifest and visual mappings remain documented in the asset plan.

Canonical validation is `npm run check`; there is no lint script.
