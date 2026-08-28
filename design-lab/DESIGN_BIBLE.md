# Open Finish Design Bible

Status: active foundation
Last updated: 2026-08-29

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

The Dashboard's primary Continue action opens a chooser with no preselected direction. Directions are grouped into Practice, Sport, and Friction blocks. Historically frequent directions appear first within each block, followed by the remaining active directions. Frequency helps retrieval; it does not become a recommendation score, rank, or default decision. This refines the original global frequency ordering (OF-0020).

### Session history layers

Selected-day history shows activity totals above a chronological list of individual sessions. Returning to the same activity creates another entry in the sequence, not a merged session. Recording time is labelled explicitly and remains distinct from the editable operational date and session duration; it must not be presented as a session start time. Missing timestamps are shown as unavailable, never invented.

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

### Current art direction — Neotrad Japan × Hi-tech Data

The current website is the visual baseline, explicitly reaffirmed by the user on 2026-08-28 (OF-0021). Evolve its combination of expressive Japanese illustration and ornament with precise, contemporary data interfaces. Do not revert to the earlier Japanese-minimalism interpretation or restart from the original D/E explorations.

Japanese scenes, botanical ornament, and the existing figurative/icon assets carry identity; typography, hierarchy, chart geometry, and interaction states keep information legible. Reuse the project's established visual assets where appropriate rather than replacing their character with generic decoration. Richness must not obscure dates, values, controls, or selection states. Hi-tech Data does not authorize meaningless animation or a competitive game interface.

Uploaded reports explain the evolution and earlier review findings; they are historical evidence, not new implementation instructions. The user's current direction takes precedence over conflicting older aesthetic restrictions. The original D/E composition rationale, Dashboard/History responsibilities, factual data encodings, sport separation, and accessibility requirements remain in force.

The user subsequently approved the current History preview and requested publication on 2026-08-29 (OF-0022). Daily effort now uses compact pale translucent tiles with crops of the existing burgundy Japanese maple ornament, legible dates, a clear selection ring, and distinct practice/sport markers. Preserve this accepted treatment when refining History. This is not blanket approval of other experiments. Exact cross-screen typography, palette, surface, elevation, radius, iconography, illustration-placement, and animation tokens still require explicit consolidation; their refinement must stay within this direction.

Dashboard concepts A–E remain comparative evidence, not five parts of the design system and not approved alternatives to mix freely.
