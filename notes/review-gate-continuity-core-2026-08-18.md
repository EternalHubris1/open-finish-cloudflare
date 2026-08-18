# Review Gate: continuity core in the original Open Finish

Date: 18 August 2026

## Decision

**Ready for source review, migration smoke test, and visual QA in the original Replit environment. Not yet deployed.**

The approved parts of the Manus exploration were adapted into the original project rather than merged as a branch. Task-manager mechanics and speculative visual experiments were excluded.

## What entered the release candidate

1. Optional session reflection: recall, what moved, what was learned, and next continuation.
2. Reflections library with a durable, ordered Evidence Shelf.
3. One durable Weekly Reflection per week.
4. Focused Dashboard with one primary Continue action.
5. Continue chooser with no preselection and historically frequent directions first.
6. Minimal Today Context: one intention, one direction, and an optional external HTTP(S) link.
7. Activity direction context: purpose, current thread, and evidence note.
8. Timezone-correct dates, safe partial log edits, deterministic log ordering, and external URL validation.
9. Reduced routine gamification: new achievements are limited to infrequent system milestones.
10. One-time, non-destructive migration path for compatible browser-only reflection evidence.

## Explicit exclusions

- no task list, checkboxes, plan-item completion, close-day, or carry-forward;
- no Google Drive or Vikunja synchronization, OAuth, task import, or status mutation;
- no Weekly Reset success metric;
- no Rhythm Experiment, Evidence Constellation, or preview data on the production Dashboard;
- no automatic release of the Manus branch.

## Data and API review

- Incremental migration adds reflection columns and the daily context, evidence shelf, and weekly reflection tables.
- GET Today Context is read-only and returns `null` when no record exists.
- Shelf updates reject duplicates and missing logs.
- Weekly reflections reject duplicates and references to evidence that is not currently kept on the shelf.
- External context links accept HTTP(S) only.
- Deploy start now applies migrations before starting the API.

## Verification completed

- Workspace TypeScript build: passed.
- API server typecheck: passed.
- Learning Tracker typecheck: passed.
- Continuity helper tests: 5 passed, 0 failed.
- API schemas regenerated from the updated OpenAPI contract.

## Verification still required in Replit

1. Apply the migration to a disposable copy of the original database and verify rollback/recovery procedure.
2. Run the production build in Linux/Replit. The repository intentionally excludes Windows build binaries, so the production build cannot be reproduced on this Windows checkout.
3. Perform the full browser path on desktop and mobile: create direction → set Today Context → Continue chooser → log and reflect → keep evidence → save Weekly Reflection → reload.
4. Check keyboard order, focus return, touch targets, loading/error/empty states, and reduced motion.
5. Confirm old records with null reflection fields remain readable.

## Open product decisions — do not include without approval

1. ~~Inquiry Threads~~ — excluded from the current release under OF-0016; revisit only after the Obsidian connection clarifies the need.
2. ~~Evidence Constellation~~ — excluded from the current release under OF-0016; any future graph must use real, attributable Obsidian links.
3. ~~Google Drive/Vikunja direction~~ — resolved as OF-0015: links are sufficient now; permissioned context integrations belong on the future roadmap.

## Design memory

Recorded as OF-0010 through OF-0017 in `design-lab/DECISIONS.md` and incorporated into `design-lab/DESIGN_BIBLE.md`.
