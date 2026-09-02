# Sequential sprints

Status: Experimental

## Question

Person / moment / tension: a deadline for one direction may require several closures across consecutive days. A flat deadline hides the route; a generic task list would turn Open Finish into a task manager.

Most expensive assumption: that the sequence itself is durable product data, rather than temporary display copy attached to a deadline.

## Concepts

### A — Checklist inside a deadline

Optimizes implementation speed. Sacrifices identity, daily timing, and a clear lifecycle. Rejected because a deadline would become an overloaded container.

### B — Independent sprint with ordered daily steps

Optimizes continuity and makes the next closure immediately legible. A sprint belongs to an optional Activity, has one outcome and time boundary, and owns ordered steps with planned dates. Selected for the experiment.

### C — Generated daily plan from a target

Optimizes automation. Sacrifices authorship and requires rescheduling rules before the system understands enough context. Deferred.

## Recommendation

Use an independent Sprint entity. Keep Milestone as a calm checkpoint; use Sprint only when the route matters. Steps unlock in order. Reopening an earlier step also reopens every later step, preserving sequence truth. Completing the final step closes the sprint automatically.

## Validation

- A sprint can be attached to an Activity without changing the Activity itself.
- The creator supports one to thirty-one chronologically ordered steps inside the sprint dates.
- Only the first pending step is actionable.
- Closing the last step closes the sprint; reopening an earlier step reopens the dependent tail.
- The compact path works without color alone and wraps on narrow screens.

## Memory

Not approved as a reusable rule. Awaiting review of the working implementation.
