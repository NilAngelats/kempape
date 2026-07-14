# Kempape Markdown Documentation Package — V2

Copy the contents of this package into the root of the Kempape repository.

This version integrates the approved cross-system flows for:

* Actions with validation-only behavior.
* Chaos Card snapshots, locks, two outgoing attacks, and delayed resolution.
* The two-tab Validation Pool.
* Testing and run-scoped data.
* Remote admin reset.
* Realtime synchronization priorities.
* Level 40 ranking XP.
* Runtime asset locations and naming.

## Installation

1. Copy `AGENTS.md`, `CODEX_HANDOFF.md`, `docs`, and the included `public` example into the project root.
2. Allow replacement of existing files with the same paths.
3. Keep actual images under `public/assets/`.
4. Rename `manifest.example.json` to `manifest.json` when creating the real asset manifest.
5. Archive old TXT handoffs outside `docs/rules`.
6. Review the Git diff before committing.

The old documentation ZIP should not remain the source of truth after this package is installed.
