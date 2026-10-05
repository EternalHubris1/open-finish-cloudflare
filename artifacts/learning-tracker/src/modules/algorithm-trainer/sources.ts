import type { Problem } from "./catalog.ts";

export type LearningSource = {
  id: string;
  title: string;
  url: string;
  kind: "official" | "practice" | "community";
  detail: string;
  revision?: string;
};
export const reviewedAt = "2026-10-06";
export const learningSources: LearningSource[] = [
  {
    id: "yandex-algorithms",
    title: "Яндекс · алгоритмическая секция",
    url: "https://yandex.ru/jobs/interview/algorithms",
    kind: "official",
    detail:
      "Официальные примеры: анаграммы и генерация скобок. Это примеры типов задач, а не гарантия их появления на интервью.",
  },
  {
    id: "yandex-analytics",
    title: "Яндекс · подготовка аналитиков",
    url: "https://yandex.ru/jobs/interview/analytics",
    kind: "official",
    detail:
      "Девять задач LeetCode прямо рекомендованы для Python-подготовки. Рекомендация не означает, что их задавали на интервью.",
  },
  {
    id: "yandex-ml",
    title: "Яндекс · ML-интервью",
    url: "https://yandex.ru/jobs/interview/mldev",
    kind: "official",
    detail:
      "Контекст подготовки к ML-секции; наши pandas/ML-упражнения авторские, не задачи из этой страницы.",
  },
  {
    id: "coderun",
    title: "CodeRun · открытый каталог",
    url: "https://coderun.yandex.ru/catalog",
    kind: "practice",
    detail:
      "Дополнительная русскоязычная практика с проверкой на платформе. Каталог не импортирован и не является списком вопросов компании.",
  },
  {
    id: "neetcode",
    title: "NeetCode · карта паттернов",
    url: "https://neetcode.io/roadmap",
    kind: "practice",
    detail:
      "Ориентир для покрытия паттернов, не свидетельство конкретного интервью. Наш порядок и объяснения самостоятельные.",
  },
  {
    id: "patterns",
    title: "Sean Prashad · LeetCode Patterns",
    url: "https://github.com/seanprashad/leetcode-patterns",
    kind: "practice",
    detail:
      "Тематическая практика. На проверенной версии лицензия CC BY-NC 4.0; код, условия и подборка не скопированы.",
    revision: "58790638003d8b45c71a69a4f9ad4fffefa61155",
  },
  {
    id: "interactive",
    title: "Donne Martin · Python challenges",
    url: "https://github.com/donnemartin/interactive-coding-challenges",
    kind: "practice",
    detail:
      "Дополнительные ноутбуки и тесты под Apache 2.0. Используем ссылку на ресурс, не импортируем его материалы.",
    revision: "358f2cc60426d5c4c3d7d580910eec9a7b393fa9",
  },
  {
    id: "recruiter-list",
    title: "Naumovets · список от рекрутеров",
    url: "https://github.com/Naumovets/yandex-tasks/blob/1654615b92566464e966a2c275d4beeea6435f70/README.md",
    kind: "community",
    detail:
      "По словам автора, ссылки прислали рекрутеры Яндекса. Неофициальная рекомендация; факт появления на интервью не подтверждён. Лицензия не указана, используем только ссылки.",
    revision: "1654615b92566464e966a2c275d4beeea6435f70",
  },
  {
    id: "candidate-report",
    title: "Shipovmax · отчёт кандидата",
    url: "https://github.com/Shipovmax/Yandex_interview/tree/add31a0bc6686eaea8059b695c446068a80e281a",
    kind: "community",
    detail:
      "Автор заявляет, что задачи встречались на интервью Яндекса. Независимого подтверждения нет. Лицензия не указана; условия и решения открываются в оригинале.",
    revision: "add31a0bc6686eaea8059b695c446068a80e281a",
  },
];
export function learningSource(id: string): LearningSource {
  const source = learningSources.find((item) => item.id === id);
  if (!source) throw new Error(`Unknown learning source: ${id}`);
  return source;
}
export const officialPrepSlugs = [
  "longest-nice-substring",
  "find-target-indices-after-sorting-array",
  "number-of-arithmetic-triplets",
  "reverse-words-in-a-string-iii",
  "average-of-levels-in-binary-tree",
  "unique-email-addresses",
  "shortest-completing-word",
  "find-resultant-array-after-removing-anagrams",
  "take-k-of-each-character-from-left-and-right",
];
// Only exact URLs present in the pinned README are attributed to this list.
export const recruiterSlugs = [
  "merge-k-sorted-lists",
  "linked-list-cycle",
  "add-two-numbers",
  "reverse-linked-list",
  "binary-search",
  "guess-number-higher-or-lower",
  "search-a-2d-matrix",
  "search-in-rotated-sorted-array",
  "find-minimum-in-rotated-sorted-array",
  "search-in-rotated-sorted-array-ii",
  "single-number",
  "two-sum",
  "4sum",
  "group-anagrams",
  "valid-anagram",
  "find-all-anagrams-in-a-string",
  "valid-parentheses",
  "number-of-islands",
  "remove-invalid-parentheses",
  "merge-intervals",
  "top-k-frequent-words",
  "top-k-frequent-elements",
  "container-with-most-water",
  "partition-labels",
  "sliding-window-median",
  "sliding-window-maximum",
  "longest-repeating-character-replacement",
  "same-tree",
  "symmetric-tree",
  "balanced-binary-tree",
  "path-sum-ii",
  "best-time-to-buy-and-sell-stock",
  "best-time-to-buy-and-sell-stock-ii",
  "best-time-to-buy-and-sell-stock-with-transaction-fee",
  "best-time-to-buy-and-sell-stock-with-cooldown",
];
export function provenance(problem: Problem) {
  if (problem.id.startsWith("custom-"))
    return {
      label: "Личная задача",
      detail:
        "Источник и факт интервью указаны вами; автоматически не подтверждаются.",
      sources: [] as LearningSource[],
    };
  if (problem.id.startsWith("dojo-interview-"))
    return {
      label: "Отчёт кандидата · не подтверждён",
      detail: learningSource("candidate-report").detail,
      sources: [learningSource("candidate-report")],
    };
  if (problem.id.startsWith("dojo-"))
    return {
      label: "Авторское упражнение",
      detail:
        "Разминка для переноса паттерна. Не выдаётся за задачу конкретного собеседования.",
      sources: [] as LearningSource[],
    };
  const slug = problem.id.slice(3);
  const sources: LearningSource[] = [];
  const officialExample = ["valid-anagram", "generate-parentheses"].includes(
    slug,
  );
  if (officialExample) sources.push(learningSource("yandex-algorithms"));
  if (officialPrepSlugs.includes(slug))
    sources.push(learningSource("yandex-analytics"));
  if (recruiterSlugs.includes(slug))
    sources.push(learningSource("recruiter-list"));
  return {
    label: officialExample
      ? "Официальный пример интервью"
      : officialPrepSlugs.includes(slug)
        ? "Официальная рекомендация для подготовки"
        : sources.length
          ? "Список рекрутеров · по словам автора"
          : "Задача LeetCode · интервью-практика",
    detail: officialExample
      ? "Тип задачи приведён самим Яндексом. Не утверждаем, что это тот же вариант LeetCode или что он будет на вашем интервью."
      : "Не подтверждаем частоту, дату или факт появления этой задачи на конкретном интервью.",
    sources,
  };
}
