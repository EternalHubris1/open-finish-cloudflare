import source from "./linear-models.json" with { type: "json" };
export const linearModels = source;
export const sprintKey = source.id;
export const sprintTitle = "Матспринт · часть 2";
export type LessonState = {
  status: "not_started" | "in_progress" | "review" | "completed";
  viewed: boolean;
  practiced: boolean;
  criterionConfirmed: boolean;
  notes: string;
  solution: string;
  solutionUrl: string;
  plannedDate: string | null;
  sessions: { id: string; recordedAt: string; minutes: number; note: string }[];
};
export type LessonRecord = {
  lessonNumber: number;
  version: number;
  state: LessonState;
};
export const lessonStatusNames = {
  not_started: "Не начато",
  in_progress: "В процессе",
  review: "Нужно повторить",
  completed: "Завершено",
};
export function emptyLesson(): LessonState {
  return {
    status: "not_started",
    viewed: false,
    practiced: false,
    criterionConfirmed: false,
    notes: "",
    solution: "",
    solutionUrl: "",
    plannedDate: null,
    sessions: [],
  };
}
export function canComplete(state: LessonState) {
  return state.viewed && state.practiced && state.criterionConfirmed;
}
export function practiceId(day: number, index: number) {
  return `dojo-${sprintKey}-day-${String(day).padStart(2, "0")}-practice-${String(index + 1).padStart(2, "0")}`;
}
export function assessmentId(index: number) {
  return `dojo-${sprintKey}-final-${String(index + 1).padStart(2, "0")}`;
}
export function lessonHref(day: number, preview = false) {
  return `/reflections?sprint=${sprintKey}&lesson=${day}${preview ? "&preview" : ""}#math-sprint`;
}
export function taskHref(id: string, preview = false) {
  return `/algorithms?task=${id}${preview ? "&preview" : ""}`;
}
export const mathTasks = [
  ...source.days.flatMap((day) =>
    day.practice.map((statement, index) => ({
      id: practiceId(day.number, index),
      title: `${day.number}.${index + 1} · ${day.title}`,
      topic: day.title,
      difficulty: "Easy",
      statement,
      starter: "",
      hints: [day.if_stuck],
      track: "math" as const,
      manual: true as const,
      answer: day.answer,
      answerLabel: "Проверка к занятию (для обеих задач)",
      lessonNumber: day.number,
    })),
  ),
  ...source.final_assessment.map((assessment, index) => ({
    id: assessmentId(index),
    title: `Итог · ${assessment.title}`,
    topic: "Итоговая проверка",
    difficulty: "Medium",
    statement: assessment.task,
    starter: "",
    hints: [],
    track: "math" as const,
    manual: true as const,
    answer: assessment.answer,
    answerLabel: "Ответ для самопроверки",
    lessonNumber: 13,
  })),
];
