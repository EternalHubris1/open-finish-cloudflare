import { catalog, type Problem } from "./catalog.ts";
import {
  isDue,
  type PracticeRecord,
} from "../../../../../modules/algorithm-trainer/model.ts";

export type LearningBlock = {
  id: string;
  title: string;
  phase: string;
  prerequisites: string[];
  outcome: string;
  cue: string;
  invariant: string;
  check: string;
  core: string[];
  topics: string[];
  sources: string[];
};
const lc = (...slugs: string[]) => slugs.map((slug) => `lc-${slug}`);
export function difficultyLevel(difficulty: string): string {
  return difficulty === "Foundation" ? "Easy" : difficulty;
}
// Original curriculum. Core order is deliberate; supplemental exercises remain optional.
export const learningBlocks: LearningBlock[] = [
  {
    id: "hash",
    title: "Массивы, строки и частоты",
    phase: "01 · Основа",
    prerequisites: [],
    topics: ["Arrays & hashing"],
    sources: ["yandex-algorithms", "yandex-analytics", "patterns"],
    outcome:
      "Выбрать множество или словарь, убрать вложенный поиск и оценить память.",
    cue: "Повторения, подсчёт частот, поиск дополнения или группировка по ключу.",
    invariant:
      "Перед шагом словарь описывает уже обработанный префикс; новый элемент не должен использовать сам себя.",
    check:
      "Объясните, почему множество не заменяет счётчик для анаграмм; проверьте повторы, пустой ввод и отрицательные числа.",
    core: [
      "dojo-first-repeat",
      ...lc(
        "contains-duplicate",
        "two-sum",
        "valid-anagram",
        "group-anagrams",
        "product-of-array-except-self",
      ),
    ],
  },
  {
    id: "pointers",
    title: "Два указателя",
    phase: "01 · Основа",
    prerequisites: ["hash"],
    topics: ["Two pointers"],
    sources: ["neetcode", "recruiter-list", "yandex-analytics"],
    outcome:
      "Обосновать движение указателей, сохраняя порядок или исключая заведомо невозможные пары.",
    cue: "Отсортированный ввод, проверка с двух концов, слияние или удаление на месте.",
    invariant:
      "Всё за границами указателей уже обработано; каждый сдвиг исключает только ненужные кандидаты.",
    check:
      "Объясните, почему можно сдвинуть конкретную сторону; сравните с перебором O(n²).",
    core: [
      "dojo-merge-signals",
      ...lc(
        "valid-palindrome",
        "two-sum-ii-input-array-is-sorted",
        "container-with-most-water",
        "3sum",
      ),
    ],
  },
  {
    id: "window",
    title: "Скользящее окно",
    phase: "02 · Линейные паттерны",
    prerequisites: ["hash", "pointers"],
    topics: ["Sliding window"],
    sources: ["recruiter-list", "neetcode", "yandex-analytics"],
    outcome:
      "Поддерживать состояние подотрезка и отличать фиксированное окно от переменного.",
    cue: "Непрерывный участок, ограничение на частоты, самый длинный или короткий допустимый фрагмент.",
    invariant:
      "После сжатия окно удовлетворяет ограничению; добавление и удаление симметрично меняют состояние.",
    check:
      "Покажите, почему обе границы проходят массив не больше одного раза. Убедитесь, что отрицательные числа не ломают выбранный критерий.",
    core: [
      "dojo-window-total",
      ...lc(
        "best-time-to-buy-and-sell-stock",
        "longest-substring-without-repeating-characters",
        "permutation-in-string",
        "longest-repeating-character-replacement",
      ),
    ],
  },
  {
    id: "stack",
    title: "Стек и отложенные ответы",
    phase: "02 · Линейные паттерны",
    prerequisites: ["hash"],
    topics: ["Stack"],
    sources: ["neetcode", "recruiter-list", "candidate-report"],
    outcome:
      "Применить обычный и монотонный стек и объяснить амортизированную стоимость.",
    cue: "Вложенность, отмена последнего действия, ближайший больший элемент.",
    invariant:
      "Стек содержит только ещё не закрытые состояния; в монотонном стеке порядок значений сохраняется.",
    check:
      "Каждый элемент добавляется и удаляется максимум один раз. Проверьте равные значения и отсутствие ответа.",
    core: [
      "dojo-brackets",
      ...lc(
        "valid-parentheses",
        "min-stack",
        "evaluate-reverse-polish-notation",
        "daily-temperatures",
      ),
    ],
  },
  {
    id: "binary",
    title: "Бинарный поиск и границы",
    phase: "02 · Линейные паттерны",
    prerequisites: ["pointers"],
    topics: ["Binary search"],
    sources: ["recruiter-list", "yandex-analytics"],
    outcome:
      "Задать интервал поиска и монотонный предикат без ошибок на границе.",
    cue: "Отсортированный ввод или вопрос «достаточно ли значения x?» с монотонным ответом.",
    invariant:
      "Искомая граница остаётся внутри кандидатов; каждое обновление строго уменьшает интервал.",
    check:
      "Проверьте пустой массив, первый и последний элементы, дубликаты и отсутствие значения.",
    core: [
      "dojo-lower-bound",
      ...lc(
        "binary-search",
        "search-insert-position",
        "search-a-2d-matrix",
        "koko-eating-bananas",
        "search-in-rotated-sorted-array",
      ),
    ],
  },
  {
    id: "lists",
    title: "Связные списки",
    phase: "03 · Структуры и обходы",
    prerequisites: ["pointers"],
    topics: ["Linked lists"],
    sources: ["recruiter-list", "interactive"],
    outcome:
      "Перестраивать связи без потери узлов и распознавать цикл двумя скоростями.",
    cue: "Нет произвольного доступа по индексу; нужны переворот, слияние или поиск середины.",
    invariant:
      "До изменения ссылки сохранён следующий узел; обработанная и оставшаяся части не теряются.",
    check:
      "Нарисуйте связи для 0, 1 и 2 узлов. Объясните отличие перестановки ссылок от копирования значений.",
    core: lc(
      "reverse-linked-list",
      "merge-two-sorted-lists",
      "linked-list-cycle",
      "remove-nth-node-from-end-of-list",
      "reorder-list",
    ),
  },
  {
    id: "trees",
    title: "Деревья: DFS, BFS и состояние",
    phase: "03 · Структуры и обходы",
    prerequisites: ["stack", "lists"],
    topics: ["Trees"],
    sources: ["yandex-algorithms", "recruiter-list", "yandex-analytics"],
    outcome:
      "Выбрать обход и определить, что возвращает рекурсивный вызов или хранит очередь.",
    cue: "Иерархия, уровни, путь от корня, ограничения BST.",
    invariant:
      "Результат поддерева имеет один ясный смысл; BFS обрабатывает текущий уровень отдельно от следующего.",
    check:
      "Проверьте пустое и вырожденное дерево; оцените память через высоту или ширину, не только число узлов.",
    core: lc(
      "maximum-depth-of-binary-tree",
      "same-tree",
      "binary-tree-level-order-traversal",
      "balanced-binary-tree",
      "validate-binary-search-tree",
    ),
  },
  {
    id: "heap",
    title: "Куча и top-k",
    phase: "03 · Структуры и обходы",
    prerequisites: ["hash", "trees"],
    topics: ["Heap"],
    sources: ["recruiter-list", "interactive"],
    outcome:
      "Поддерживать k лучших кандидатов и сравнить кучу с полной сортировкой.",
    cue: "Лучший элемент в потоке, k ближайших или слияние нескольких упорядоченных источников.",
    invariant:
      "Корень — худший из сохраняемых лучших кандидатов; размер ограничен k.",
    check:
      "Объясните O(n log k) и обработку равных приоритетов; сравните с O(n log n).",
    core: lc(
      "last-stone-weight",
      "kth-largest-element-in-a-stream",
      "kth-largest-element-in-an-array",
      "k-closest-points-to-origin",
      "top-k-frequent-elements",
    ),
  },
  {
    id: "backtracking",
    title: "Рекурсия и перебор с возвратом",
    phase: "03 · Структуры и обходы",
    prerequisites: ["stack", "trees"],
    topics: ["Backtracking"],
    sources: ["yandex-algorithms", "interactive"],
    outcome:
      "Построить дерево вариантов, отсечь недопустимые ветви и восстановить состояние.",
    cue: "Все комбинации, подмножества, перестановки, поиск пути с выбором.",
    invariant:
      "Состояние после возврата такое же, как до выбора; каждый ответ порождается один раз.",
    check:
      "Оцените число ответов отдельно от накладных расходов; проверьте повторяющиеся элементы.",
    core: lc(
      "subsets",
      "permutations",
      "generate-parentheses",
      "combination-sum",
      "word-search",
    ),
  },
  {
    id: "graphs",
    title: "Графы и зависимости",
    phase: "03 · Структуры и обходы",
    prerequisites: ["trees", "hash", "heap"],
    topics: ["Graphs"],
    sources: ["recruiter-list", "interactive", "candidate-report"],
    outcome:
      "Найти компоненты, кратчайший путь без весов и порядок зависимостей.",
    cue: "Связность, сетка, распространение по шагам, задачи с prerequisites.",
    invariant:
      "Вершина отмечена при постановке в очередь; для топологического порядка входящие степени учитывают оставшиеся рёбра.",
    check:
      "Различайте BFS без весов и Дейкстру с неотрицательными весами; проверьте цикл и несвязный граф.",
    core: [
      "dojo-rooms",
      ...lc(
        "flood-fill",
        "number-of-islands",
        "rotting-oranges",
        "course-schedule",
        "network-delay-time",
      ),
    ],
  },
  {
    id: "greedy",
    title: "Жадный выбор",
    phase: "04 · Оптимизация состояния",
    prerequisites: ["window"],
    topics: ["Greedy"],
    sources: ["neetcode", "recruiter-list"],
    outcome:
      "Обосновать локальный выбор или найти контрпример, если он не работает.",
    cue: "Достижимость, лучшая текущая граница, непересекающиеся решения.",
    invariant:
      "После префикса сохранена граница, не хуже любой альтернативы; это нужно доказать, а не угадать.",
    check:
      "Сформулируйте аргумент обмена или доминирования; попробуйте построить контрпример.",
    core: lc(
      "maximum-subarray",
      "jump-game",
      "jump-game-ii",
      "partition-labels",
      "gas-station",
    ),
  },
  {
    id: "intervals",
    title: "Интервалы и сортировка",
    phase: "04 · Оптимизация состояния",
    prerequisites: ["pointers", "greedy"],
    topics: ["Intervals"],
    sources: ["recruiter-list", "patterns"],
    outcome: "Свести пересечения к проходу по сортированным границам.",
    cue: "Расписания, объединение отрезков, конфликты и покрытие.",
    invariant:
      "Завершённые интервалы уже не пересекутся с будущими; текущая граница описывает ещё открытый участок.",
    check:
      "Уточните, пересекаются ли касающиеся границы. Проверьте вложенные и одинаковые интервалы.",
    core: [
      "dojo-intervals",
      ...lc("merge-intervals", "insert-interval", "non-overlapping-intervals"),
    ],
  },
  {
    id: "dp-linear",
    title: "Динамика: одномерное состояние",
    phase: "04 · Оптимизация состояния",
    prerequisites: ["backtracking", "greedy"],
    topics: ["Dynamic programming"],
    sources: ["neetcode", "interactive"],
    outcome: "Определить смысл dp, базу и переход до написания кода.",
    cue: "Повторяющиеся подзадачи; локальный выбор не учитывает будущие ограничения.",
    invariant:
      "При вычислении состояния все его зависимости уже известны; база соответствует самому короткому вводу.",
    check:
      "Выведите переход из последнего выбора. Сначала табличное решение, затем сокращение памяти.",
    core: [
      "dojo-steps",
      ...lc(
        "climbing-stairs",
        "min-cost-climbing-stairs",
        "house-robber",
        "coin-change",
        "longest-increasing-subsequence",
      ),
    ],
  },
  {
    id: "dp-grid",
    title: "Динамика: две оси и выбор",
    phase: "04 · Оптимизация состояния",
    prerequisites: ["dp-linear"],
    topics: [],
    sources: ["neetcode", "candidate-report"],
    outcome:
      "Задать две координаты состояния и восстановить порядок переходов.",
    cue: "Две строки, решётка, сумма и доступные предметы; продвинутый вариант — маска выбранных вершин.",
    invariant:
      "Каждая координата имеет смысл; обновление на месте не должно случайно использовать текущее состояние дважды.",
    check:
      "Нарисуйте малую таблицу вручную; объясните разницу 0/1-выбора и неограниченного использования.",
    core: lc(
      "unique-paths",
      "longest-common-subsequence",
      "partition-equal-subset-sum",
      "coin-change-ii",
      "edit-distance",
    ),
  },
  {
    id: "trie",
    title: "Префиксные деревья",
    phase: "05 · Дополнительные структуры",
    prerequisites: ["hash", "trees", "backtracking"],
    topics: ["Tries"],
    sources: ["neetcode"],
    outcome: "Отделять конец слова от префикса и выполнять поиск по ветвям.",
    cue: "Много запросов по общим префиксам или шаблонам слов.",
    invariant:
      "Путь кодирует прочитанный префикс, признак terminal — наличие полного слова.",
    check:
      "Проверьте ситуацию, когда слово является префиксом другого; сравните память со словарём строк.",
    core: lc(
      "implement-trie-prefix-tree",
      "design-add-and-search-words-data-structure",
    ),
  },
  {
    id: "bits",
    title: "Биты, числа и матрицы",
    phase: "05 · Дополнительные структуры",
    prerequisites: ["hash", "binary"],
    topics: ["Math & bits"],
    sources: ["interactive", "recruiter-list"],
    outcome:
      "Применять битовые инварианты и аккуратно преобразовывать индексы.",
    cue: "Чётность повторений, фиксированные битовые маски, координатные преобразования.",
    invariant:
      "Повторный XOR отменяет число; у матричного преобразования каждый исходный индекс имеет единственный адрес назначения.",
    check:
      "Уточните разрядность и знак. Битовые операции не заменяют доказательство корректности.",
    core: lc(
      "single-number",
      "number-of-1-bits",
      "counting-bits",
      "missing-number",
      "rotate-image",
    ),
  },
  {
    id: "data-tables",
    title: "pandas: табличный пайплайн",
    phase: "D1 · Отдельный трек данных",
    prerequisites: ["hash"],
    topics: ["pandas"],
    sources: ["yandex-analytics", "interactive"],
    outcome:
      "Фильтровать, агрегировать и соединять таблицы, не теряя смысл строк.",
    cue: "Строки с ключами, группы, пропуски и несколько источников данных.",
    invariant:
      "После каждого шага известны зерно таблицы, число строк и уникальность ключа.",
    check:
      "Сравните результат со здравым смыслом; объясните, почему JOIN способен размножить строки. Упражнения авторские, не подтверждённые интервью.",
    core: [
      "dojo-data-filter",
      "dojo-data-group",
      "dojo-data-missing",
      "dojo-data-join",
      "dojo-data-sales-case",
    ],
  },
  {
    id: "data-models",
    title: "NumPy и ML: воспроизводимый кейс",
    phase: "D2 · Отдельный трек данных",
    prerequisites: ["data-tables"],
    topics: ["NumPy", "ML / scikit-learn", "Data analysis"],
    sources: ["yandex-ml"],
    outcome: "Проверить формы массивов и подготовить модель без утечки данных.",
    cue: "Числовые признаки, масштабирование, baseline и проверка качества вне обучения.",
    invariant:
      "Преобразования обучаются только на train; test не участвует в настройке.",
    check:
      "Сравните с baseline, объясните метрику и воспроизведите запуск. Итоговый Colab-кейс оценивается вручную.",
    core: [
      "dojo-data-normalize",
      "dojo-data-column-means",
      "dojo-data-ml-case",
    ],
  },
];
// Place cross-topic problems where their actual technique belongs.
const overrides: Record<string, string> = {
  "lc-generate-parentheses": "backtracking",
  "lc-top-k-frequent-elements": "heap",
  "dojo-interview-treasures": "dp-grid",
};
const gridDP = lc(
  "unique-paths",
  "longest-common-subsequence",
  "partition-equal-subset-sum",
  "coin-change-ii",
  "target-sum",
  "interleaving-string",
  "distinct-subsequences",
  "edit-distance",
  "burst-balloons",
);
export function blockFor(problem: Problem): LearningBlock | undefined {
  const override =
    overrides[problem.id] ??
    (gridDP.includes(problem.id) ? "dp-grid" : undefined);
  return override
    ? learningBlocks.find((block) => block.id === override)
    : learningBlocks.find((block) => block.topics.includes(problem.topic));
}
export function blockProblems(block: LearningBlock): Problem[] {
  const inBlock = catalog.filter(
    (problem) => blockFor(problem)?.id === block.id,
  );
  return [
    ...block.core
      .map((id) => catalog.find((problem) => problem.id === id)!)
      .filter(Boolean),
    ...inBlock.filter((problem) => !block.core.includes(problem.id)),
  ];
}
export function taskStage(block: LearningBlock, problem: Problem): string {
  const index = block.core.indexOf(problem.id);
  if (index === -1) return "Дополнительно";
  if (problem.id.startsWith("dojo-") && !problem.colabOnly) return "Разминка";
  if (index === block.core.length - 1) return "Самопроверка";
  return index <= 1 ? "Базовый паттерн" : "Перенос паттерна";
}
export function latestOutcome(record?: PracticeRecord) {
  return record?.state.attempts.reduce<
    PracticeRecord["state"]["attempts"][number] | undefined
  >(
    (latest, attempt) =>
      !latest || attempt.recordedAt >= latest.recordedAt ? attempt : latest,
    undefined,
  )?.outcome;
}
export function blockProgress(
  block: LearningBlock,
  saved: Map<string, PracticeRecord>,
) {
  return {
    total: block.core.length,
    independent: block.core.filter(
      (id) => latestOutcome(saved.get(id)) === "independent",
    ).length,
  };
}
export function nextInBlock(
  block: LearningBlock,
  saved: Map<string, PracticeRecord>,
  today?: string,
) {
  return (
    block.core.find((id) => isDue(saved.get(id)?.state, today)) ??
    block.core.find((id) => latestOutcome(saved.get(id)) !== "independent")
  );
}
export function mixedPractice(
  saved: Map<string, PracticeRecord>,
  today?: string,
): Problem[] {
  const blocks = learningBlocks.filter((block) => !block.phase.startsWith("D"));
  // One review/transfer candidate per already attempted block, never random duplicates.
  return blocks.flatMap((block) => {
    if (!block.core.some((id) => saved.get(id)?.state.attempts.length))
      return [];
    const id =
      block.core.find((key) => isDue(saved.get(key)?.state, today)) ??
      block.core.find(
        (key) => latestOutcome(saved.get(key)) !== "independent",
      ) ??
      block.core[block.core.length - 1];
    return [catalog.find((problem) => problem.id === id)!];
  });
}
