# Open Finish Design Bible

Status: active foundation
Last updated: 2026-08-18

This file contains only approved design decisions. Proposals, moodboards, references, and prototypes belong in explorations until approval.

## Product character

Open Finish is a Personal Operating System: a long-lived environment for personal mastery. It should feel directional, calm, capable, and cumulative—not managerial, gamified, or obsessed with throughput.

Every screen should help a person understand at least one of four things:

- current state;
- momentum;
- focus;
- direction.

The product may learn from best-in-class software, but its composition, typography, color, motion, data language, and emotional tone must resolve into a recognizable Open Finish identity rather than a collage of references.

## Information responsibilities

- **Dashboard:** present state, momentum, focus, and direction. It is for orientation and the next meaningful move.
- **History:** analytics, trends, breakdowns, and long-term insight. It is for reflection and pattern recognition.
- Do not move analytical density into the dashboard merely because the data is available.

## Motion

Motion must communicate continuity, hierarchy, focus, state change, or reward. Decorative motion without informational work is outside the language. Every motion decision must have a reduced-motion equivalent.

## Data visualization

Charts are product surfaces, not reporting widgets. They must communicate their primary insight immediately, support exploration when useful, remain accessible without color alone, and share the product's typography, spacing, surface, and interaction language. Default chart-library aesthetics are not an acceptable final state.

### Dashboard energy language

The production Dashboard combines Concept D's spacious single-focus composition with Concept E's atmosphere. Its weekly view uses two complementary encodings:

- daily bars show factual effort through height and an ordered infrared color scale;
- a softly illuminated continuous line shows accumulated **Momentum** and visibly decays after quiet days.

Momentum is a signature metaphor for the current tempo of development. It is never displayed as a score, level, quota, badge, or competitive rank. Its aura must remain attached to real data and become static under reduced motion.

### Practice and sport clocks

Practice/work and sport are distinct activity domains. The Dashboard's vertical bars, targets, focused totals, and Momentum use practice time only. Sport appears directly beneath each day as a slim horizontal teal lane with its own minute label; its visual hierarchy is secondary but never hidden. History preserves the same split in summaries, charts, selected-day details, and activity pages. A sport session must never inflate practice Momentum.

Activity type cannot be communicated by color alone. Compact labels and semantic icons accompany the restrained expanded palette. The Activity library favors a dense, scannable grid; its richer icon, color, and category choices belong inside creation/editing rather than expanding every card.

## General rewards

Open Finish keeps general, system-wide rewards. They commemorate rare meaningful milestones across the whole Personal OS rather than routine activity completion. Rewards live in Achievements; the Dashboard may show their total, but Momentum remains a separate present-state signal and never becomes a reward system.

## Continuity and reflection

Continuity is memory, not obligation. A learning session may preserve what moved, what was learned, and the next continuation, but these prompts remain optional. Reflections is the durable place to revisit and keep that evidence.

The Evidence Shelf is a small, intentionally curated continuity layer. It is stored with the user's data, keeps a stable order, and supports one reflection per calendar week. Compatible browser-only evidence may be imported once; local storage is never the long-term source of truth.

## Today Context

Today Context contains at most one intention, one direction, and one optional external HTTP(S) context link. It must not grow task lists, checkboxes, completion state, day-closing rituals, or automatic carry-forward without a new approved product decision. Reading today's context must not create it.

An external link is a reference, not an integration claim. The interface must not imply that Open Finish has synchronized, imported, or changed content in Google Drive, Vikunja, or another system.

Permissioned Google Drive and Vikunja context access belongs to the future roadmap. Links remain the complete current-release model; task import, status mutation, and two-way synchronization are outside the approved core.

Obsidian is the preferred future foundation for connected personal notes. Open Finish must use explicit note links and visible provenance from the person's vault rather than inventing semantic relationships. Inquiry Threads and Evidence Constellation remain outside the current release.

## Continue interaction

The Dashboard's primary Continue action opens a chooser with no preselected direction. Historically frequent directions appear first, followed by the remaining active directions. Frequency helps retrieval; it does not become a recommendation score, rank, or default decision.

## Continuity data trust

Calendar-day behavior follows the person's current timezone. Partial edits preserve omitted fields, entries with the same date have deterministic order, and user-provided context links accept only HTTP(S). These are product trust requirements, not implementation details.

## Navigation and control feedback

The left panel is an orientation instrument, not a feature inventory. Group current orientation, long-view surfaces, and system utilities separately. Alerts and Profile belong in the lower system area. The current location must remain identifiable without color alone through surface, marker, icon treatment, and `aria-current`.

Buttons respond with a restrained lift on fine-pointer hover, a short compression on activation, a clear keyboard focus ring, and explicit pending or disabled treatment. These effects communicate affordance and state; they must not become continuous decorative motion. Touch and reduced-motion modes retain state clarity without relying on hover or animation.

## System completeness

Every approved pattern includes its loading, empty, error, success, edge, responsive, keyboard, touch, and reduced-motion behavior where relevant. A polished default state does not make an incomplete component approved.

## Design memory

- An explicit approval moves a proposal into this Bible and the decision log.
- A recurring review comment becomes a candidate rule; once confirmed as generally applicable, record it here instead of repeating the comment screen by screen.
- Future work evolves approved rules. It does not silently replace them.
- When a rule changes, mark the previous decision superseded and preserve the rationale.
- Similarity to a reference is never sufficient rationale; record the Open Finish-specific reason.

## Visual language status

The Dashboard direction and its Momentum language are approved. Typography, broader product color, surface, elevation, radius, iconography, illustration, and cross-screen animation tokens remain open system decisions.

Dashboard concepts A–E remain comparative evidence, not five parts of the design system and not approved alternatives to mix freely.
