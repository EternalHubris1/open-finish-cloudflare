export const WEEKLY_REVIEW_STORAGE_PREFIX = "open-finish:weekly-review:";

export type StoredWeeklyReflection = {
  weekStart: string;
  notice: string;
  carry: string;
  evidenceIds: string[];
  keptEvidenceIds: number[];
  savedAt: string;
};

export function weeklyReviewStorageKey(weekStart: string) {
  return `${WEEKLY_REVIEW_STORAGE_PREFIX}${weekStart}`;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function numberArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === "number")
    : [];
}

export function readStoredWeeklyReflections() {
  const reviews: StoredWeeklyReflection[] = [];
  if (typeof window === "undefined") return reviews;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(WEEKLY_REVIEW_STORAGE_PREFIX)) continue;
    const weekStart = key.slice(WEEKLY_REVIEW_STORAGE_PREFIX.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) continue;

    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(key) ?? "{}",
      ) as Record<string, unknown>;
      if (typeof parsed.savedAt !== "string") continue;
      reviews.push({
        weekStart,
        notice: typeof parsed.notice === "string" ? parsed.notice.trim() : "",
        carry: typeof parsed.carry === "string" ? parsed.carry.trim() : "",
        evidenceIds: stringArray(parsed.evidenceIds),
        keptEvidenceIds: numberArray(parsed.keptEvidenceIds),
        savedAt: parsed.savedAt,
      });
    } catch {
      // An invalid local record should never interrupt a reading of the archive.
    }
  }

  return reviews.sort((left, right) =>
    right.weekStart.localeCompare(left.weekStart),
  );
}

export function readWeeklyReflection(weekStart: string) {
  return (
    readStoredWeeklyReflections().find(
      (review) => review.weekStart === weekStart,
    ) ?? null
  );
}
