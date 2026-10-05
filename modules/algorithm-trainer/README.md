# Algorithm trainer — working module

Implemented with explicit user authorization (2026-10-05) to extend beyond Design Lab prototypes, on `dgt/algorithm-trainer`.

## Product choice

Compared: a separate clone/catalog (fragments personal history), a task-manager integration (adds obligation), and a focused Algorithms room (selected: preserves personal practice in the existing private workspace). No changes to Dashboard Momentum, sport clocks or session records.

UI is experimental within the approved Neotrad Japan × Hi-tech Data language. No new art-direction decision is silently promoted into the Design Bible.

## Boundaries

- Lazy-loaded `/algorithms` room, isolated catalog, runner, UI and state model.
- Original dōjō exercises have locally visible fixtures. External tasks are link-only; no scraped statements, copied solutions or premium company-frequency data.
- Pattern/reference sources: https://github.com/seanprashad/leetcode-patterns and https://github.com/neetcode-gh/leetcode. This is a curated local index, **not** a live import or synchronization claim. External task availability/difficulty may change.
- Python uses pinned Pyodide 314.0.7 from jsDelivr, downloaded only on Run. Runs use a disposable browser worker, 180-second loading timeout, 10-second execution timeout, Stop, output truncation and automatic termination. It is **not** a hostile-code sandbox; do not execute untrusted third-party scripts. No user code runs on the site server. Explicit runtime presets load only allowlisted NumPy/pandas packages, never arbitrary imports or URLs.
- External problems support scratch runs, not automatic acceptance or source submissions. Original local fixtures verify sample behavior, not algorithmic complexity.
- Authentication is inherited from the existing API gate. Progress persists in the additive `algorithm_practice` table, one versioned JSON document per problem. Optimistic writes reject stale edits instead of overwriting them. Existing tables/data are untouched.
- Notes, drafts, queue membership, repeat dates and attempts remain editable. Export provides a portable copy. Browser-only storage is not presented as permanent persistence. Design preview keeps temporary state in memory only.

## API

- `GET /api/algorithm-trainer`: all saved records.
- `PUT /api/algorithm-trainer/:id`: `{version, state}`; first write uses version 0, successful writes increment the version. Conflict returns 409; drafts remain in the UI.
- Existing request body limit applies; drafts 24k characters, notes 6k, at most 100 attempts per task. Dates and IDs are validated; source URLs are hard-coded HTTP(S), never imported executable payloads.

## Next increments

Permission-checked import adapters, stronger fixture suites, accessible code-editor enhancement, export restore/merge and explicit session-log linking. Personal interview tasks can already be added/edited with an optional source link, original statement and JSON fixtures. Do not silently turn test passes into mastery or company hiring predictions.

## Data-analysis track (2026-10-05)

- Six original Russian exercises: filtering, group aggregation, missing values, joins, min–max normalization and column means. Built-in tasks select the required runtime automatically; personal tasks can select pandas/NumPy manually. The runtime selection itself is session-local, not saved in a personal task record.
- Two Colab capstones: synthetic sales-quality/EDA and leak-free ML evaluation. These intentionally have no automated mastery score or local Run. Reproducible notebook templates live in `notebooks/`; their Colab links point to the retained `dgt/algorithm-trainer` branch.
- Every task exports a valid Jupyter notebook containing the current draft, statement, package imports and visible fixtures. Capstones also include a deterministic dataset-generation cell. No account history, tokens or private datasets are exported automatically.
- In Colab use File → Upload notebook for a downloaded draft; the direct template link opens the original template, not unsaved site edits. Review outcomes and notes are recorded manually on the site. No Google authorization, Drive mounting or background compute integration.
- Browser tasks return plain Python JSON-shaped values; call `.tolist()` for NumPy arrays/Series. This avoids ambiguous DataFrame/array equality. Complex visualization and scikit-learn work belong in Colab.
- Sources: https://pyodide.org/en/stable/usage/api/js-api.html and https://research.google.com/colaboratory/faq.html (official package loading and notebook upload guidance).
