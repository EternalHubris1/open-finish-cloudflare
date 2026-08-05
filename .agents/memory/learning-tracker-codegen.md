---
name: Learning tracker API codegen
description: How new API endpoints/schemas get added in this monorepo (openapi.yaml -> orval -> generated clients)
---

New/changed API endpoints for the learning-tracker + api-server pair must be added to `lib/api-spec/openapi.yaml` first, then run `pnpm run codegen` inside `lib/api-spec` (runs orval + typecheck:libs). This regenerates `lib/api-zod/src/generated/*` (used by the Express routes for request/response validation) and `lib/api-client-react/src/generated/*` (used by the React frontend's hooks). Do not hand-edit files under `generated/` — they get wiped on the next codegen run.

**Why:** the route handlers and React Query hooks are both derived from the same OpenAPI spec; skipping codegen leaves the two out of sync and produces confusing type errors.

**How to apply:** whenever a task needs a new backend endpoint or a schema field change, edit `openapi.yaml`, run the codegen script, then write the Express route (validate with the generated zod schemas) and consume the generated hook on the frontend.
