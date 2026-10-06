import { z } from "zod/v4";
export const curriculumKey = "linear-models-matrix-products-13";
export const lessonTitles = [
  "Чтение математической записи",
  "Логарифмы и преобразования выражений",
  "Линейная регрессия и квадратичная ошибка",
  "Несколько признаков и вектор весов",
  "Логистическая модель и её формула",
  "Правдоподобие как функция весов",
  "Вывод LogLoss и чтение слайдов",
  "Обычная производная и правило цепочки",
  "Частные производные и шаг обучения",
  "Матрица признаков и предсказания для таблицы",
  "Произведение двух матриц и устройство модели",
  "Градиент линейной регрессии по координатам и матрично",
  "Дифференцирование матричного произведения",
];
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });
export const lessonWrite = z.object({
  version: z.number().int().min(0),
  state: z
    .object({
      status: z.enum(["not_started", "in_progress", "review", "completed"]),
      viewed: z.boolean(),
      practiced: z.boolean(),
      criterionConfirmed: z.boolean(),
      notes: z.string().max(6000),
      solution: z.string().max(24000),
      solutionUrl: z
        .string()
        .max(2000)
        .refine((value) => {
          if (!value) return true;
          try {
            const url = new URL(value);
            return (
              ["https:", "http:"].includes(url.protocol) &&
              !url.username &&
              !url.password
            );
          } catch {
            return false;
          }
        }, "Укажите HTTP(S)-ссылку на решение"),
      plannedDate: calendarDate.nullable(),
      sessions: z
        .array(
          z.object({
            id: z.uuid(),
            recordedAt: z.iso.datetime(),
            minutes: z.number().int().min(1).max(1440),
            note: z.string().max(600),
          }),
        )
        .max(100)
        .refine(
          (items) =>
            new Set(items.map((item) => item.id)).size === items.length,
          "Повторяющаяся запись времени",
        ),
    })
    .refine(
      (state) =>
        state.status !== "completed" ||
        (state.viewed && state.practiced && state.criterionConfirmed),
      "Подтвердите просмотр, практику и критерий прежде чем завершать занятие",
    ),
});
