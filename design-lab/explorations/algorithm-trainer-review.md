# Algorithm room — implementation review (2026-10-05)

## Scope and selection

User explicitly authorized a working module beyond the Design Lab prototype boundary. Compared a standalone duplicate resource, a task-manager-oriented integration, and a focused practice room. Selected the room: it attaches personal attempts to sources without pretending to recreate their platforms.

Preserves the approved spatial/data split: existing practice-hall imagery only in the hero/navigation, instrument surfaces for code, fixtures, filters and history. This is a new experimental room, not a replacement of approved pages or a new globally approved art direction. Design Bible and decision log are unchanged.

## Implemented

- Isolated lazy-loaded `/algorithms` module and navigation entry.
- 150 curated external links across algorithmic patterns, plus 10 original exercises with visible fixtures and staged hints. Source solutions/statements are not copied. No live source sync, company frequency or fresh-interview guarantee.
- Search, topic/difficulty filters, personal queue and earliest-date-first repetition view.
- Editable personal interview tasks with HTTP(S) link, statement and JSON fixtures.
- Python drafts and scratch/test runs in disposable browser workers, capped output, explicit Stop, 90-second startup timeout and 10-second execution timeout. No server execution or automatic installation based on code imports. This is not a hostile-code sandbox.
- Editable attempt outcomes, duration, notes, next-review date; separate queued state; readable success/error/unsaved feedback; draft/progress JSON export.
- Server persistence in an additive, isolated table; optimistic versions reject conflicting saves. Existing activity history and Momentum are untouched.

## Verified

- Frontend and API typechecks; frontend production and API builds passed.
- 20 API/auth/model tests plus 2 catalog/repetition tests passed. HTTP persistence/conflict/error tests use a request-scoped in-memory SQL adapter, **not the production database**.
- Browser: original exercise passed 4/4 fixtures; a newly added personal task passed 2/2; infinite-loop run terminated at 10 seconds without blocking the UI.
- Browser: recorded assisted attempt scheduled a repeat three calendar days later, preserved code/notes and entered the queue. Preview persistence is temporary in memory only.
- Desktop/tablet/narrow hierarchy inspected at 1440, 768 and 390px; no document horizontal overflow measured at 768/390. No claim of exhaustive accessibility/device coverage.

## Review findings and next steps

1. Expand original fixture sets and add explicit complexity checks where feasible. Passing visible examples is not full correctness or mastery.
2. Add permission-checked adapters for selected repositories; imports must never replace personal notes/attempts and must deduplicate canonical source IDs.
3. Add JSON export restore/merge, conflict-resolution UI and a richer accessible code editor. Export currently does not imply restore is available.
4. Validate authenticated persistence and Pyodide CDN availability on the deployed origin before declaring a production release. The existing site is not changed by merely creating this branch/PR.

## Risks

Initial Python startup requires Internet access to jsDelivr and downloads a runtime. External links and indicative difficulty labels can age. Only trusted personal code should be executed. Browser back-navigation remains less protected than guarded task/sidebar navigation; save/export before leaving. More elaborate conflict merging and offline draft recovery are not implemented.
