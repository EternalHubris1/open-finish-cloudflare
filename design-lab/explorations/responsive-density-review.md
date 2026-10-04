# Responsive density review

Status: experimental implementation, awaiting visual approval. 2026-10-04.

## Goal

Preserve Neotrad Japan × Hi-tech Data on large screens while reducing narrow-screen overload. This is a responsive correction under OF-0021, not a new art direction. No backend, authentication, data model, or deployment changes.

## Approaches

- Scale the desktop down: preserves composition but makes controls and chart labels cramped.
- Remove artwork: reduces noise but loses the approved identity.
- Adapt hierarchy (selected): keep scenes; reduce hero padding, compact secondary statistics, and use bottom navigation below 1024px. Costs one extra More action for Progress, rather than sacrificing content width.

## Page audit and changes

| Page | Finding | This iteration | Next recommendation |
| --- | --- | --- | --- |
| Dashboard | Tall mobile hero delays the weekly signal; streak competes with Continue | Smaller hero, readable effort plane, compact mobile streak, unbroken latest-day time | Review chart readability with long activity names and large totals |
| Activities | Tablet navigation competes with the library | Shared navigation correction; bottom clearance | Add a deterministic development fixture before claiming populated-state visual QA |
| History | Period controls squeezed beside heading on tablets; oversized collapsed effort | Stack period controls until wide desktop, compact mobile disclosure | Review a truly empty period and twelve-week chart on narrow screens |
| Cabinet | Long introductory copy and competing action row | Short mobile introduction, two-column actions, reduced padding | Test sprint editor with many tasks and long multilingual labels |
| Progress | Duplicate registration CTA in empty state; large headers | One empty-state CTA, compact mobile hero/archive | Verify a populated medal wall and upload/scale editor on narrow screens |
| Settings | System route remains accessible through More | Shared navigation correction only | Separate focused form and keyboard audit |

## Validation

- Frontend TypeScript check passed after the final source edits.
- Final production frontend build passed. Vite emitted existing sourcemap warnings for three shared UI components; they did not fail the build.
- Browser preview: 390×844 Dashboard, History, Cabinet and empty Progress; 768×1024 History; 1440×900 Dashboard.
- History Daily effort expands and exposes date-labelled selectable tiles; bottom navigation remains available.
- Document width matched viewport width at 390px and 768px. This does not prove every nested surface is free of overflow.
- Preview fixtures are synthetic, not production records. Activities populated-state, saved edits, uploads, full keyboard traversal, automated contrast and screen-reader testing remain unverified.
- Existing reduced-motion handling is retained; no new animations introduced.

## Architecture / cost

CSS media rules and existing component markup only. No runtime dependency, subscription, infrastructure, or data migration. Unrelated generated files and research folders remain untouched.

## Self review

The desktop language is preserved; narrow layouts get less visual competition without hiding records. Small secondary labels and older low-contrast treatments still deserve a dedicated accessibility pass. No new rule entered the Bible: visual acceptance is pending.

## Ready for review

Ready as a Design Lab prototype. Do not interpret a successful build as production acceptance or a complete accessibility audit.
