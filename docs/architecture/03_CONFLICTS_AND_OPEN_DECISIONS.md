# Conflicts and open decisions

| ID | Evidence and affected systems | Severity / blocking | Recommendation | Status |
|---|---|---|---|---|
| KMP-001 | Initial migration stores mutable run state globally and lacks `game_run_id` | Critical / BLOCKING implementation | If unapplied, replace before first deployment; if applied persistently, preserve history and add forward corrective migrations | RESOLVED ARCHITECTURALLY; deployment evidence needed |
| KMP-002 | Earlier freeze prohibited rejection/expiry; July 15 approval requires Accept/Reject and two-hour expiry | Critical / NON-BLOCKING | Five statuses with dedicated cancelled reason; update implementation artifacts in H3 | RESOLVED BY APPROVAL |
| KMP-003 | No Chaos snapshot/lock/deferred schema | Critical / BLOCKING H5 implementation | Add forward H5 schema after review | RESOLVED ARCHITECTURALLY |
| KMP-004 | No RLS/transactional command boundary | Critical / BLOCKING H1 implementation | Deny direct writes; authenticated server commands call transactions | RESOLVED ARCHITECTURALLY |
| KMP-005 | Earlier freeze allowed uncapped XP; July 15 approval caps Level-40 XP | High / NON-BLOCKING | Clamp `total_xp` to configured threshold; competition ties | RESOLVED BY APPROVAL |
| KMP-006 | Manifest absent; current filenames do not follow canonical IDs | High / BLOCKING affected visual implementation | Approve manifest mappings without renaming in H0 | OPEN |
| KMP-007 | Earlier System.Drawing audit falsely called PNGs unreadable | High / NON-BLOCKING | Signature/IHDR recheck confirms 97 valid PNGs | RESOLVED BY VERIFICATION |
| KMP-008 | Four Action definitions and several UI categories lack files | High / BLOCKING affected screens | Supply/approve exact missing mappings in asset plan | OPEN |
| KMP-009 | Manual early-end Chaos duration/choice is not exact | High / BLOCKING H9 early-end operation | Product owner selects exact behavior | OPEN |
| KMP-010 | Global pause appears explicitly in lifecycle lines 313–332 and supporting admin/economy/realtime rules | High / NON-BLOCKING | Retain pause intervals/effective elapsed time | RESOLVED BY PRECEDENCE |
| KMP-011 | README is package-copy guidance, not project runbook | Low / NON-BLOCKING | Rewrite in H1 | OPEN |
| KMP-012 | Deployment region/backup retention/restore target not approved | Medium / BLOCKING H9 release | Decide before release | OPEN |

Repository evidence cannot show whether migration `0001` has been applied remotely. No migration is changed in Handoff 0. An untouched database may use a replaced initial migration before first deployment; any shared/persistent database must keep migration history and receive corrective forward migrations.
