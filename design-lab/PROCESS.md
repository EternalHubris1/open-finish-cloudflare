# Design process

Use the smallest version of this process that still protects the decision. A major visual direction needs every gate; a local, already-approved correction may go directly to prototype and review.

## 1. Frame

State the person, moment, tension, and desired change. Separate product character, product model, and implementation. Name the most expensive assumption.

## 2. Research

Study current product evidence and multiple high-quality references. Extract principles and failure modes, not surface styling. Prefer primary design-system, accessibility, and platform guidance when a factual standard matters.

## 3. Compare

Produce meaningfully different approaches. For each, record what it optimizes, what it sacrifices, and what would make it wrong for Open Finish.

## 4. Select

Recommend one direction. Tie the choice to the product character and an observable criterion; do not leave a flat menu of options.

## 5. Prototype

Build only enough fidelity to test the risky decision. Include realistic content and relevant loading, empty, error, success, edge, responsive, keyboard, touch, and reduced-motion states.

## 6. Review and iterate

Review hierarchy, composition, rhythm, typography, color, interaction, motion, accessibility, system feedback, data legibility, and consistency with the existing Bible. Verify desktop, tablet, and mobile when the surface is responsive.

## 7. Remember

Approval is the gate into design memory. Update `DESIGN_BIBLE.md` and `DECISIONS.md`; update tokens or reusable rules only when the decision is genuinely general. Keep rejected concepts as research evidence, not as latent system variants.

## Working note template

```markdown
# Question
Person / moment / tension:
Most expensive assumption:

## Evidence
Current product:
References and extracted principles:

## Concepts
Direction A — optimizes / sacrifices:
Direction B — optimizes / sacrifices:
Direction C — optimizes / sacrifices:

## Recommendation
Choice and Open Finish-specific reason:
What could disprove it:

## Validation
User signal:
Responsive and accessibility checks:
State and motion checks:

## Memory
Approved decision ID or “not approved”:
Rules/tokens changed:
```
