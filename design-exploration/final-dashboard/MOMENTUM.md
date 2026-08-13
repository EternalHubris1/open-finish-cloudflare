# Momentum visual model

Status: approved concept, production visual iteration
Date: 2026-08-14

## Tension

The Dashboard needs to make a developing week *feel* alive without turning effort into another score, quota, or reward loop. Raw daily duration answers what happened; it does not communicate whether a rhythm is accumulating or fading.

## Approaches compared

### A. Separate Momentum score

A numeric index is easy to compare but becomes a target. It invites optimization, explanation, thresholds, and anxiety. Rejected because it turns the metaphor into a KPI.

### B. Ambient page aura

A page-wide glow can make the product atmospheric, but without a visible relationship to the week it reads as decoration. Rejected as the primary expression; retained only as a quiet secondary echo in the hero.

### C. Energy inside the timeline — selected

Daily bars retain the factual duration. A second, softly illuminated line carries accumulated energy forward and decays after quiet days. The current point breathes slowly when motion is allowed. This keeps evidence and feeling together without adding a card, score, badge, or leaderboard.

## Visual rules

- Use one perceptually ordered infrared ramp from quiet graphite-plum through ember to warm radiance.
- Encode daily effort with bar height as well as color; color is never the only carrier.
- Encode accumulated Momentum with line position, continuity, and a restrained aura.
- Show exact time on the selected day and keep every point keyboard-addressable.
- Reserve the largest bloom for an exceptional day; do not animate every bar.
- Under `prefers-reduced-motion`, render the complete line and all states statically.
- Keep general Achievements separate: rewards commemorate rare system-wide milestones, while Momentum communicates present tempo.

## Presentation model

Momentum is deliberately not exposed as a number. Each day blends the previous visual state with normalized recent effort; a day without effort decays the field more strongly. This is a display metaphor, not a performance grade or stored user score.

## Research synthesis

- [Carbon data-visualization palettes](https://carbondesignsystem.com/data-visualization/color-palettes/) supports ordered sequential palettes for relationship and trend views.
- [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) requires meaning to survive without hue alone.
- [W3C: Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) informs distinguishable focus and graphical boundaries.
- [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) supports purposeful, brief feedback and optional motion rather than decorative repetition.
