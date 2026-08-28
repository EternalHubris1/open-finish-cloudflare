# Website refinement — 2026-08-28

Base: `423f6fce6892b063b108ba837dd9ceb83a4a44f6`, branch `dgt/web-session-polish`.
Desktop is explicitly out of scope. Implementation initially remained local; the user approved the current History preview and authorized publication on 2026-08-29. Publication outcome is tracked by the release commit and GitHub/Cloudflare checks.

## Implemented

- Session records show actual recording time in Moscow, not an inferred session start time. Existing `createdAt` is exposed in calendar/log-list API responses; no schema migration. Old responses without the field remain readable.
- Selected day shows activity aggregates followed by individual sessions in chronological recording order, preserving repeated returns to an activity.
- Continue groups directions into Practice, Sport and Friction, keeping frequency order within each block and no preselection.
- External context link has a larger outlined hit area and retains safe new-tab attributes.
- Daily effort uses compact translucent day tiles. After visual feedback, the small custom ginkgo SVG was replaced by focused crops from the existing Japanese maple ornament (see revision below). Practice and sport indicators occupy separate lines. Removed the old instruction/intensity footer; kept the empty state and labelled day controls.
- History header matches the other page headings; mobile layout no longer squeezes the analytics summary into fragments.
- Dashboard deliberate effort excludes sport on desktop and mobile; sport appears separately after “and”.

## Verification

- Production build and frontend/API typechecks passed. Existing UI sourcemap warnings remain non-blocking.
- 12 existing API regression tests and 3 new presentation tests passed. New tests added to the quality workflow.
- Local synthetic fixtures: checked at 1440, 768 and 390px; no horizontal document overflow at 390px.
- Checked repeated session sequence, per-activity totals, empty selected day, failed history loading, grouped picker selection, recording time in Cabinet and separate sport copy.
- Production data and authenticated write flows were not exercised. QA fixtures live only under ignored `tmp/`; they are not included in builds.
- Design memory: `design-lab/DESIGN_BIBLE.md`, `design-lab/DECISIONS.md` (OF-0020–OF-0022). Requirements and current History appearance approved; Neotrad Japan × Hi-tech Data retained as the baseline.

## Connectivity: unresolved

- Worker root returned HTTP 200 from the test environment.
- `eternal.dojo-dgt.ru` returned NXDOMAIN, including via resolver 1.1.1.1. This is a separate DNS problem, not a frontend bug.
- Access from the user's ISP without VPN has not been reproduced. Cloudflare documents service disruption for Russian networks: https://developers.cloudflare.com/support/troubleshooting/general-troubleshooting/service-disruption/
- Need the exact failing URL and a comparison from the affected connection before choosing DNS repair versus a hosting/network change. No DNS, VPN, security or deployment settings were changed.

## Local tooling

The repository excludes Windows native build packages. Matching native binaries were installed only in ignored `tmp/web-qa-native/`, supplied via `NODE_PATH`; dependency manifests and lockfile remain unchanged.

## Daily effort visual revision

- User feedback: the first 32px implementation lost the ornament and looked weaker than the imagery.
- Reviewed the existing pattern library, including `maple-branch-scroll-source.png` and `japanese-ornament-transparent-v2-cropped.png`.
- Reused the latter, already shipped by the site, through CSS focal crops; no new raster asset or image download. These are maple leaves, not ginkgo.
- Active tiles now have a pale paper/glass ground, a legible date label, burgundy practice and teal sport markers. Size is 40px on larger screens and 36px on phones. Empty days remain quiet. The pattern is decorative; accessible minute labels and selection state remain data-driven.
- Typecheck and frontend production build passed. User accepted the revised History preview for publication on 2026-08-29; recorded in OF-0022.
