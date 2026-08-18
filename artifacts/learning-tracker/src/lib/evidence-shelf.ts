export type KeptEvidence = {
  id: number;
  activityId: number;
  activityName: string;
  activityColor: string;
  logDate: string;
  text: string;
  savedAt: string;
};

export const EVIDENCE_SHELF_STORAGE_KEY = "open-finish:evidence-shelf";
export const EVIDENCE_SHELF_CHANGE_EVENT = "open-finish:evidence-shelf-change";

function isKeptEvidence(value: unknown): value is KeptEvidence {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<KeptEvidence>;
  return (
    typeof entry.id === "number" &&
    typeof entry.activityId === "number" &&
    typeof entry.activityName === "string" &&
    typeof entry.activityColor === "string" &&
    typeof entry.logDate === "string" &&
    typeof entry.text === "string" &&
    typeof entry.savedAt === "string"
  );
}

export function readEvidenceShelf(): KeptEvidence[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(EVIDENCE_SHELF_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(stored)
      ? stored.filter(isKeptEvidence).slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

export function writeEvidenceShelf(entries: KeptEvidence[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    EVIDENCE_SHELF_STORAGE_KEY,
    JSON.stringify(entries.slice(0, 6)),
  );
  window.dispatchEvent(new CustomEvent(EVIDENCE_SHELF_CHANGE_EVENT));
}

export function moveEvidenceShelfEntry(
  entries: KeptEvidence[],
  id: number,
  direction: "up" | "down",
): KeptEvidence[] {
  const index = entries.findIndex((entry) => entry.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= entries.length)
    return entries;
  const reordered = [...entries];
  [reordered[index], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[index],
  ];
  return reordered;
}
