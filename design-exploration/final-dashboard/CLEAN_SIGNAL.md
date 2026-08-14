# Clean Signal interaction study

Status: experimental
Date: 2026-08-14

## Question

Can Open Finish keep the atmosphere and signature Momentum metaphor while making the Dashboard cleaner, calmer, and faster to read?

## Direction under review

- Replace the mixed infrared environment with a cool graphite foundation.
- Reserve coral for active direction and gold for exceptional accumulated energy.
- Remove most brown, violet, and decorative red light from the Dashboard shell.
- Use Focus Lens inside related groups: the hovered or keyboard-focused item remains clear while siblings retain only enough contrast for context.
- Keep motion purposeful and restrained; every transition has a reduced-motion equivalent.

## Interaction pilots

1. **Focus Lens:** related bars and cards reduce emphasis around the active item.
2. **Living transition:** a saved session confirms itself beside the changed context and briefly energizes its day.
3. **Momentum trail:** the selected day reveals the segment and qualitative influence it contributed.
4. **Achievement ritual:** the latest unseen system-wide reward receives one deliberate reveal, then becomes a normal permanent mark.
5. **Quiet mode:** the Dashboard collapses to current focus, present Momentum, and the continuation action.
6. **Spatial continuity:** opening a day carries the same date and origin into History.
7. **Adaptive atmosphere:** quiet, building, holding, and exceptional states adjust the ambient field without becoming a score.

## Authentication detail

The login remains readable. The password keeps native password semantics and autofill behavior, but its hidden visual representation uses crosses; a labeled control can reveal the actual characters.

## Validation gate

The study is not an approved replacement for OF-0008 yet. Approve it only if dark and light themes both feel cleaner, Focus Lens preserves context, motion does not distract, touch and keyboard behavior remain complete, and the new reward reveal still feels rare rather than gamified.

## Review notes — 2026-08-14

- Reviewed the Dashboard at desktop, tablet-width, and 390 px mobile sizes in dark and light themes; no page-level horizontal overflow was observed.
- Focus Lens preserved the active day at full contrast while dimming its siblings, including the keyboard-focus path.
- Mobile now opens the weekly timeline with the selected latest day in view instead of showing the start of the week.
- Quiet mode retained the current focus, Momentum summary, and continuation action without leaving an ambiguous empty state.
- The login kept the username readable, displayed crosses while the password remained a native password field, and exposed a labeled reveal control.
- Achievement data is guarded against unexpected response shapes and invalid dates; the local design preview no longer contacts the API.
- Reduced-motion fallbacks and Dashboard-to-History date/origin continuity were verified in code; live browser re-check of those two paths was blocked by the local-page browser policy after the main visual pass.

## Secondary-surface pass — 2026-08-14

- History now uses a graphite-to-coral-to-gold intensity scale instead of brown, crimson, and purple; activity comparison uses a small curated signal palette rather than arbitrary chart colors.
- History keeps analytical density, while Dashboard remains responsible for present state and direction. The shared palette creates continuity without making the two screens structurally identical.
- Achievements now reserves gold for earned system-wide marks and coral for action. The ordinary grid, progress surface, ritual, loading, empty, error, and cached-error states share one visual language.
- Local preview data is available for History and Achievements without contacting the API, so the complete responsive states can be reviewed safely.
- Desktop and 390 px mobile review passed with no page-level horizontal overflow. The 12-week History period stays contained within its chart scroller.
- Recharts animation and achievement progress transitions stop under reduced motion.
