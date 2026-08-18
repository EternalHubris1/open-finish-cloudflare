export type ReflectionEvidence = {
  id: number;
  logDate: string;
  recallNote?: string | null;
  whatMoved?: string | null;
  whatLearned?: string | null;
  nextContinuation?: string | null;
};

export type ReflectionResonance = {
  id: number;
  date: string;
  kind: "Recall" | "Shift" | "Learning" | "Continuation";
  text: string;
};

function firstEvidenceText(
  entry: ReflectionEvidence,
): Omit<ReflectionResonance, "id" | "date"> | null {
  if (entry.whatLearned) return { kind: "Learning", text: entry.whatLearned };
  if (entry.whatMoved) return { kind: "Shift", text: entry.whatMoved };
  if (entry.recallNote) return { kind: "Recall", text: entry.recallNote };
  if (entry.nextContinuation)
    return { kind: "Continuation", text: entry.nextContinuation };
  return null;
}

/**
 * Returns the nearest earlier reflection with saved evidence. It intentionally uses recency,
 * rather than a score or semantic judgement, so the learner decides whether any relationship is meaningful.
 */
export function findNearestReflectionResonance(
  entries: ReflectionEvidence[],
  excludeLogId: number | null,
): ReflectionResonance | null {
  const nearest = [...entries]
    .filter((entry) => entry.id !== excludeLogId)
    .sort(
      (left, right) =>
        right.logDate.localeCompare(left.logDate) || right.id - left.id,
    )
    .find((entry) => Boolean(firstEvidenceText(entry)));
  if (!nearest) return null;
  const evidence = firstEvidenceText(nearest);
  return evidence
    ? { id: nearest.id, date: nearest.logDate, ...evidence }
    : null;
}
