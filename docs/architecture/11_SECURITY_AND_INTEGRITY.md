# Security and integrity

- Hash invite codes and session tokens; reveal invites once. Use random tokens in `HttpOnly`, `Secure`, `SameSite=Lax` cookies with rotation/revocation.
- Use generic login errors, rate limits, CSRF protection, and server-only service keys.
- Authorize every operation; deny direct gameplay writes with RLS. Resolve actor and active run server-side.
- Use database time and cryptographic server randomness; never accept outcomes, amounts, timestamps, or supply from clients.
- Claim idempotency with request hashes. Enforce unique source/grant constraints for all rewards and effects.
- Lock balances/supply deterministically. Use immutable results and a transactional outbox.
- Revalidate target, phase, status and run inside each transaction.
- Log request/actor/run/command/result/duration, redacting codes, tokens, secrets and private evidence.
- Back up before live/high-risk operations; test restore; preserve append-only audit history.

Existing weaknesses: the initial migration has no RLS, game-run boundary, transactional functions, complete audit/combat model, and contradicts Action rules. `.env.local` is ignored and its values were not copied. Placeholder login UI is not authentication.
