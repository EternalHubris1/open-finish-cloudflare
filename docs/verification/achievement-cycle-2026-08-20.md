# Achievement revival — production verification (2026-08-20)

**Worker URL:** `https://open-finish-cloudflare.dgt-saunin.workers.dev`

**Worker version:** `bcb52e11-5bad-47d3-b9bd-a19edfe429da`

**Source commit:** `459ee32` — `feat: revive achievement journey and feedback`

## Published scope

The release replaces the former sparse achievement thresholds with an idempotent achievement engine. It evaluates real recorded activity against early, medium, and long-horizon journey marks, including sessions, practice minutes, sport minutes, active days, directions, and per-activity streaks. The new engine runs after a session updates its streak and is also available from the authenticated **Review journey** action.

The new UI shows named locked marks and their conditions, progress toward the next mark, a purposeful empty state, a success confirmation for a manual review, and a restrained light interaction on earned cards. Motion remains disabled for users who prefer reduced motion.

## Verification

| Check | Result |
| --- | --- |
| API unit and smoke tests | 9/9 passed, including idempotent achievement reconciliation. |
| TypeScript | API and frontend type checks passed. |
| Production build | Passed. |
| `GET /api/healthz` without session | `401`. |
| `GET /api/achievements` without session | `401`. |
| `POST /api/achievements/reconcile` without session | `401`. |
| Neon data during verification | Not read, created, updated, or deleted. |

The production check deliberately did not press **Review journey**, because that action can create achievement rows only when documented conditions have already been met. The feature is therefore live but remains user-initiated for the initial historical reconciliation.
