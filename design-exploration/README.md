# Dashboard exploration

> **Status: experimental.** These concepts are comparative studies, not approved design language. Selection and any resulting system rules must be recorded in `../design-lab/DESIGN_BIBLE.md` and `../design-lab/DECISIONS.md`.

Five concepts use the same live dashboard data and actions. They are intentionally separate from the production `/` route until one direction is selected.

| Concept | Philosophy | Primary interaction | Trade-off |
| --- | --- | --- | --- |
| A — Editorial | Progress as an unfolding personal narrative | Read the week, then continue a direction | Most atmospheric; less information-dense |
| B — Command Center | Dense operational workspace | Scan telemetry and launch from the mission queue | Fastest scanning; intentionally technical |
| C — Analytics First | Evidence and distribution lead | Explore timeline and activity share | Best analysis; less emotional warmth |
| D — Minimal Focus | Reduce the dashboard to the next meaningful action | Continue one current direction | Lowest friction; hides secondary context |
| E — Mission Control | Shared momentum across independent pursuits | Balance daily energy and trajectories | Strongest system metaphor; visually richest |

Preview routes (development only):

- `/explore/dashboard-a?preview=1`
- `/explore/dashboard-b?preview=1`
- `/explore/dashboard-c?preview=1`
- `/explore/dashboard-d?preview=1`
- `/explore/dashboard-e?preview=1`

Without `preview=1`, the routes use authenticated live data. The production dashboard remains unchanged.

Screenshots are available in `design-exploration/screenshots` at 1440px desktop, 834px tablet, and 390px mobile widths.
