export type CompletionKind = "book" | "course" | "block";

export type CompletionRecord = {
  id: string;
  kind: CompletionKind;
  title: string;
  creator: string;
  completedOn: string;
  durationMinutes: number;
  mark: string;
  medalImage?: string;
  medalScale?: number;
  description: string;
};

const STORAGE_KEY = "open-finish:completion-records";
export const COMPLETION_RECORDS_CHANGED = "completion-records:changed";

export function loadCompletionRecords(): CompletionRecord[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as CompletionRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveCompletionRecords(records: CompletionRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(COMPLETION_RECORDS_CHANGED));
}

export const completionKindLabel: Record<CompletionKind, string> = {
  book: "Books",
  course: "Courses",
  block: "Completed blocks",
};

export function completionDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${rest ? ` ${rest}m` : ""}`;
}
