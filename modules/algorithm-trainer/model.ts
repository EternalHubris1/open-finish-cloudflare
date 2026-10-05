export type Outcome = "independent" | "assisted" | "retry";
export type Attempt = {
  id: string;
  recordedAt: string;
  minutes: number;
  outcome: Outcome;
  note: string;
};
export type CustomProblem = {
  title: string;
  topic: string;
  url: string;
  statement: string;
  tests: { args: unknown[]; expected: unknown }[];
};
export type PracticeState = {
  code: string;
  notes: string;
  queued: boolean;
  nextReview: string | null;
  attempts: Attempt[];
  custom?: CustomProblem;
};
export type PracticeRecord = {
  problemId: string;
  version: number;
  state: PracticeState;
};
export function emptyState(code = ""): PracticeState {
  return { code, notes: "", queued: false, nextReview: null, attempts: [] };
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function reviewDate(outcome: Outcome, now = new Date()): string {
  const date = new Date(now);
  date.setDate(
    date.getDate() + { independent: 7, assisted: 3, retry: 1 }[outcome],
  );
  return localDate(date);
}
export function isDue(
  state: PracticeState | undefined,
  today = localDate(),
): boolean {
  return !!state?.nextReview && state.nextReview <= today;
}
