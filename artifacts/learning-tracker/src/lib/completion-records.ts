export type CompletionKind = "book" | "course" | "block";

export type CompletionRecord = {
  id: string;
  kind: CompletionKind;
  title: string;
  creator: string;
  completedOn: string;
  durationMinutes: number;
  mark: string;
  description: string;
};

// Design-Lab fixtures until the completion-record API is approved.
export const previewCompletionRecords: CompletionRecord[] = [
  {
    id: "five-rings",
    kind: "book",
    title: "The Book of Five Rings",
    creator: "Miyamoto Musashi",
    completedOn: "2026-08-12",
    durationMinutes: 690,
    mark: "五",
    description: "Timing, distance, and seeing the whole field.",
  },
  {
    id: "data-signal",
    kind: "course",
    title: "Data Visualization: Story & Signal",
    creator: "Independent course",
    completedOn: "2026-07-28",
    durationMinutes: 1260,
    mark: "視",
    description: "Turning dense measurements into legible comparisons.",
  },
  {
    id: "practice-cycle",
    kind: "block",
    title: "Thirty Days of Deliberate Practice",
    creator: "Personal study cycle",
    completedOn: "2026-06-30",
    durationMinutes: 2480,
    mark: "道",
    description: "A finished block with conclusions and a next return point.",
  },
];

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
