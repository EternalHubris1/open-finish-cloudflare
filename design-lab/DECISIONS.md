# Design decisions

This is the permanent decision history. IDs never change; superseded entries remain visible.

| ID      | Status   | Decision                                                                                                                                                                                 | Approved   | Source                                         |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------- |
| OF-0001 | Approved | Define Open Finish as a Personal Operating System for long-term mastery, not a task manager, habit tracker, productivity app, or admin dashboard.                                        | 2026-08-14 | Design Lab charter                             |
| OF-0002 | Approved | Give Dashboard and History separate responsibilities: orientation now versus analysis over time.                                                                                         | 2026-08-14 | Design Lab charter                             |
| OF-0003 | Approved | Use motion only to communicate continuity, hierarchy, focus, state change, or reward; respect reduced motion.                                                                            | 2026-08-14 | Design Lab charter                             |
| OF-0004 | Approved | Treat charts as integrated product design, not default reporting widgets.                                                                                                                | 2026-08-14 | Design Lab charter                             |
| OF-0005 | Approved | Build a distinct Open Finish identity by synthesizing references rather than imitating named products.                                                                                   | 2026-08-14 | Design Lab charter                             |
| OF-0006 | Approved | Make every approved decision cumulative design memory; evolve it explicitly and convert recurring feedback into reusable rules.                                                          | 2026-08-14 | Design Memory rule                             |
| OF-0007 | Approved | Use Concept D's spacious focus with Concept E's atmosphere as the production Dashboard direction.                                                                                        | 2026-08-14 | Production Dashboard approval                  |
| OF-0008 | Approved | Make Momentum a signature, non-numeric visual metaphor: daily effort remains factual bars while accumulated energy forms a restrained line and aura that decay after pauses.             | 2026-08-14 | User direction and Momentum study              |
| OF-0009 | Approved | Keep general rewards as rare system-wide milestones in Achievements; do not merge them with Momentum or routine activity completion.                                                     | 2026-08-14 | User clarification                             |
| OF-0010 | Approved | Add optional session reflection and continuation fields, with a separate Reflections surface that preserves evidence without turning logs into mandatory journaling.                     | 2026-08-18 | Manus review and user approval                 |
| OF-0011 | Approved | Keep Today Context to one intention, one direction, and an optional external HTTP(S) context link; do not add task lists, completion, close-day, or carry-forward mechanics.             | 2026-08-18 | User selected recommendation                   |
| OF-0012 | Approved | Strengthen the focused Dashboard direction and make Continue open an unselected chooser that presents historically frequent directions first.                                            | 2026-08-18 | User selected Dashboard A and refined Continue |
| OF-0013 | Approved | Store Evidence Shelf and one Weekly Reflection per week durably on the server, with a one-time non-destructive import of compatible browser-only evidence.                               | 2026-08-18 | User approval of continuity core               |
| OF-0014 | Approved | Treat timezone-correct calendar dates, non-destructive partial updates, deterministic log ordering, and validated external URLs as release invariants for continuity data.               | 2026-08-18 | Review finding accepted for release            |
| OF-0015 | Approved | Keep external context links as the current Google Drive/Vikunja model and place permissioned integrations on the future roadmap without task synchronization in the current release.     | 2026-08-18 | User roadmap decision                          |
| OF-0016 | Approved | Exclude Inquiry Threads and Evidence Constellation from the current release; use a future Obsidian connection as the foundation for linked-note context instead.                         | 2026-08-18 | User release decision                          |
| OF-0017 | Approved | Give navigation and buttons a calm interaction language: layered sidebar hierarchy, unmistakable current location, tactile hover/press/focus feedback, and reduced-motion parity.        | 2026-08-18 | User visual-improvement request                |
| OF-0018 | Approved | Keep sport on a separate clock from practice/work: main bars and Momentum represent deliberate practice, while a slim secondary lane shows movement without turning it into work output. | 2026-08-18 | User sport-dashboard direction                 |
| OF-0019 | Approved | Make the Activity library compact and scannable while expanding meaningful category, color, and icon choices; type and icon labels must support color rather than depend on it.          | 2026-08-18 | User activity-library request                  |

## Entry format

When adding a decision, record:

- decision and status (`Proposed`, `Approved`, or `Superseded`);
- user problem and context;
- alternatives considered;
- trade-off accepted;
- observable validation criterion;
- affected rules or tokens;
- date, approver, and superseded decision ID if applicable.

## OF-0010 — Optional reflection and continuation

- **Problem:** a duration and note do not preserve enough context to return to long-running work.
- **Trade-off:** reflection remains optional; the system gains continuity without making every session a form to complete.
- **Validation:** a person can save, revisit, edit, and keep reflection evidence independently of the activity log list.
- **Affected rules:** Reflections, session logging, activity detail, Evidence Shelf.

## OF-0011 — Minimal Today Context

- **Problem:** the product needs immediate orientation without reproducing a task manager.
- **Alternatives rejected:** multi-step plans, checkboxes, completion state, close-day rituals, and automatic carry-forward.
- **Trade-off:** one intention is deliberately less expressive than a plan but keeps attention on direction rather than throughput.
- **Validation:** the context can be read without creating data; an external URL is explicit, optional, and never presented as synced content.

## OF-0012 — Focused Dashboard and Continue chooser

- **Problem:** continuing the last activity made an accidental historical choice feel like a recommendation.
- **Trade-off:** Continue adds one selection step, while frequency ordering reduces search cost without silently deciding for the person.
- **Validation:** the chooser opens with no selected activity, frequent directions appear first, and the Dashboard retains one dominant action.

## OF-0013 — Durable continuity memory

- **Problem:** browser-only evidence disappears across devices and cannot support a trustworthy long-lived Personal OS.
- **Trade-off:** server persistence adds schema and migration cost; local data is imported only once and is never allowed to overwrite newer server state silently.
- **Validation:** shelf order and weekly reflection survive reloads and device changes; each week has a single reflection record.

## OF-0014 — Continuity data invariants

- **Problem:** UTC day boundaries, destructive PATCH behavior, unstable ordering, and unsafe links undermine trust.
- **Validation:** calendar dates follow the client timezone, omitted fields survive edits, equal-day logs remain stable, and only HTTP(S) links are accepted.

## OF-0015 — External systems roadmap

- **Current model:** Open Finish stores and opens an external HTTP(S) context link; it does not claim to read or synchronize its contents.
- **Future direction:** investigate permissioned Google Drive and Vikunja context access so an agent can read a linked source when invited.
- **Boundary:** importing tasks, changing external statuses, or turning Open Finish into a task manager requires a separate product decision.
- **Validation:** the current release remains useful with links alone, while the roadmap preserves a path to richer context without overstating present capabilities.

## OF-0016 — Obsidian as the linked-note foundation

- **Current release:** Inquiry Threads and Evidence Constellation remain excluded.
- **Future direction:** connect Obsidian with explicit permission and use real note links and metadata instead of inferring a decorative relationship graph.
- **Trade-off:** connected-note exploration arrives later, but its relationships will come from a system the person already maintains and understands.
- **Validation:** no speculative note graph appears before Obsidian access, provenance, privacy, and failure states are designed.

## OF-0017 — Navigation and control feedback

- **Problem:** a flat sidebar and weak button states made location and action readiness less legible than the surrounding Dashboard art direction.
- **Direction:** group navigation by responsibility, keep Alerts and Profile in the lower system area, make the active route visible through structure and not color alone, and give buttons short hover, press, focus, pending, and disabled feedback.
- **Trade-off:** the sidebar becomes visually richer but remains quieter than the main content and does not display productivity counters or badges.
- **Validation:** current location is obvious at a glance, controls feel responsive with mouse, keyboard, and touch, and reduced-motion mode preserves every state without animation.

## OF-0018 — Separate sport time

- **Problem:** combining sport with practice makes invested-work history less truthful and hides bodily effort inside the same total.
- **Direction:** every activity is either practice or sport. Practice drives the main daily bars, targets, current Momentum, and work summaries. Sport keeps its own minutes and appears as a slim teal lane beneath the day plus a small explicit label in histories.
- **Trade-off:** combined elapsed time is still available internally, but the primary product language uses two clocks rather than one simpler total.
- **Validation:** adding a sport session changes sport time and its lane, but never changes practice Momentum, practice target status, or focused-work totals. Legacy Fitness activities resolve as sport without rewriting saved records.

## OF-0019 — Compact Activity library

- **Problem:** large cards and a narrow visual vocabulary made a growing set of directions slow to scan and hard to distinguish.
- **Direction:** use a denser responsive library, 16 restrained colors, 20 semantic icons, richer categories, and an explicit practice/sport selector. Keep optional direction context collapsed until needed.
- **Trade-off:** more choices live inside creation/editing, while the main library remains compact and low-noise.
- **Validation:** the library carries more activities per viewport; every choice works by keyboard and has a text label or accessible name; sport is identifiable without color alone.
