# Republish data-safety gate

The current production database must survive every Open Finish republish.

## Automated protections

- Deployment startup runs only `migrate:safe` before the API starts.
- `migrate:safe` rejects migrations containing drop, truncate, delete, update, rename, or create-or-replace operations.
- The current continuity migration only adds nullable columns, new tables, foreign keys, and indexes with `IF NOT EXISTS` protection.
- Production startup contains no seed or data-clear path.
- The manual demo-data clear script refuses to run in production and requires an explicit confirmation value elsewhere.
- The force-push database schema command is not exposed as a package script.

## Required manual gate before Republish

1. Confirm the target is the original Replit app `Open Finish`, not the Manus edition.
2. Confirm the existing production deployment is healthy and record its URL.
3. Create or verify a restorable production database backup in Replit.
4. Run `pnpm --filter @workspace/db snapshot:data` against production and save its row counts and ID digests with the release record.
5. Review the schema diff. Never select an `overwrite data` option.
6. Republish only after the migration safety check, typechecks, build, and browser smoke test pass.
7. Run the same snapshot after publishing and compare it with the pre-publish record. Existing IDs and records must remain present.
8. If counts fall or existing IDs disappear, stop and restore the backup before accepting new writes.

## Current additive tables

- `activities`
- `activity_logs`
- `daily_contexts`
- `evidence_shelf`
- `weekly_reflections`

The first two keep all existing rows and receive only nullable columns. The final three are new.
