import { russianTitles } from "./russian.ts";
export type TestCase = { args: unknown[]; expected: unknown };
export type Problem = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  url?: string;
  statement?: string;
  starter: string;
  hints: string[];
  tests?: TestCase[];
};
function drill(
  slug: string,
  title: string,
  topic: string,
  statement: string,
  signature: string,
  hints: string[],
  tests: TestCase[],
): Problem {
  return {
    id: `dojo-${slug}`,
    title,
    topic,
    difficulty: "Foundation",
    statement,
    starter: `def solve(${signature}):\n    # Напишите решение здесь\n    pass\n`,
    hints,
    tests,
  };
}
// Original statements and fixtures, not copied from an external problem bank.
export const drills: Problem[] = [
  drill(
    "first-repeat",
    "Первое повторяющееся число",
    "Arrays & hashing",
    "Просматривая список целых чисел слева направо, верните первое число, встретившееся во второй раз. Если все числа различны, верните None. Требуемая сложность — O(n).",
    "values",
    [
      "Храните множество уже встреченных чисел.",
      "Проверяйте наличие числа до его добавления в множество.",
    ],
    [
      { args: [[8, 3, 8, 3]], expected: 8 },
      { args: [[1, 2, 3]], expected: null },
      { args: [[]], expected: null },
      { args: [[-2, 0, -2]], expected: -2 },
    ],
  ),
  drill(
    "merge-signals",
    "Слияние двух отсортированных списков",
    "Two pointers",
    "Даны два списка целых чисел, отсортированных по неубыванию. Верните один отсортированный список со всеми элементами, включая повторы. Не используйте sorted() и list.sort(). Требуемая сложность — O(n + m).",
    "left, right",
    [
      "Используйте отдельный указатель для каждого списка.",
      "Добавляйте меньшее из текущих чисел, затем допишите оставшуюся часть списка.",
    ],
    [
      {
        args: [
          [1, 5, 9],
          [2, 5, 8],
        ],
        expected: [1, 2, 5, 5, 8, 9],
      },
      { args: [[], [3]], expected: [3] },
      { args: [[], []], expected: [] },
      { args: [[-4, 0], [-3]], expected: [-4, -3, 0] },
    ],
  ),
  drill(
    "window-total",
    "Максимальная сумма окна",
    "Sliding window",
    "Верните максимальную сумму ровно k последовательных элементов списка. Числа могут быть отрицательными. Гарантируется 1 <= k <= len(values). Требуемая сложность — O(n).",
    "values, k",
    [
      "Начните с суммы первых k элементов.",
      "Сдвигайте окно: вычитайте уходящий элемент и добавляйте новый.",
    ],
    [
      { args: [[3, -2, 6, 1, -5], 2], expected: 7 },
      { args: [[-8, -2, -3], 2], expected: -5 },
      { args: [[4], 1], expected: 4 },
      { args: [[2, 3, 1], 3], expected: 6 },
    ],
  ),
  drill(
    "brackets",
    "Правильная скобочная последовательность",
    "Stack",
    "Строка состоит только из символов ()[]{}. Верните True, если каждой открывающей скобке соответствует закрывающая того же типа и вложенность не нарушена. Иначе верните False. Пустая строка считается правильной последовательностью.",
    "text",
    [
      "Добавляйте открывающие скобки в стек.",
      "Закрывающая скобка должна соответствовать вершине стека. В конце стек должен быть пуст.",
    ],
    [
      { args: ["{[()]()}"], expected: true },
      { args: ["([)]"], expected: false },
      { args: [""], expected: true },
      { args: ["]"], expected: false },
      { args: ["(("], expected: false },
    ],
  ),
  drill(
    "lower-bound",
    "Поиск нижней границы",
    "Binary search",
    "В списке, отсортированном по неубыванию, найдите первый индекс элемента, который не меньше target. Если такого элемента нет, верните len(values). Повторы допустимы. Требуемая сложность — O(log n).",
    "values, target",
    [
      "Ведите поиск в полуинтервале [lo, hi).",
      "Если values[mid] >= target, сдвиньте hi к mid, сохранив этот индекс среди кандидатов.",
    ],
    [
      { args: [[1, 4, 4, 8], 4], expected: 1 },
      { args: [[1, 4], 9], expected: 2 },
      { args: [[], 1], expected: 0 },
      { args: [[2, 2], 0], expected: 0 },
    ],
  ),
  drill(
    "runs",
    "Сжатие последовательных повторов",
    "Arrays & hashing",
    "Сожмите последовательные одинаковые числа в пары [число, количество], сохраняя порядок групп. Одинаковые числа, разделённые другими значениями, остаются в разных группах. Верните список пар.",
    "values",
    [
      "Сравнивайте очередное число с последней группой.",
      "Увеличьте счётчик последней группы или добавьте новую пару [число, 1].",
    ],
    [
      {
        args: [[2, 2, 5, 2]],
        expected: [
          [2, 2],
          [5, 1],
          [2, 1],
        ],
      },
      { args: [[]], expected: [] },
      { args: [[0, 0, 0]], expected: [[0, 3]] },
    ],
  ),
  drill(
    "rooms",
    "Количество компонент связности",
    "Graphs",
    "В неориентированном графе n вершин с номерами от 0 до n-1. Рёбра заданы парами [a, b]. Верните количество компонент связности, включая изолированные вершины. Номера вершин корректны.",
    "n, edges",
    [
      "Постройте список смежности.",
      "Запускайте обход из каждой ещё не посещённой вершины и подсчитывайте число запусков.",
    ],
    [
      {
        args: [
          5,
          [
            [0, 1],
            [1, 2],
            [3, 4],
          ],
        ],
        expected: 2,
      },
      { args: [3, []], expected: 3 },
      { args: [0, []], expected: 0 },
      {
        args: [
          3,
          [
            [0, 1],
            [1, 2],
            [2, 0],
          ],
        ],
        expected: 1,
      },
    ],
  ),
  drill(
    "steps",
    "Количество способов подняться по лестнице",
    "Dynamic programming",
    "Лестница состоит из n ступеней. За один шаг можно подняться на одну или две ступени. Верните количество различных последовательностей шагов до вершины. Для n=0 существует один способ — не делать шагов. Гарантируется 0 <= n <= 35.",
    "n",
    [
      "Последний шаг сделан со ступени n-1 или n-2.",
      "Достаточно хранить два предыдущих значения. Не забудьте базовый случай для нуля ступеней.",
    ],
    [
      { args: [0], expected: 1 },
      { args: [1], expected: 1 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
    ],
  ),
  drill(
    "intervals",
    "Объединение интервалов",
    "Intervals",
    "Даны интервалы [start, end], где start <= end. Объедините пересекающиеся или соприкасающиеся интервалы и верните отсортированный список. Для пустого входа верните []. Сортировка разрешена.",
    "intervals",
    [
      "Отсортируйте интервалы по началу.",
      "Объединяйте интервалы, если начало следующего не больше конца текущего.",
    ],
    [
      {
        args: [
          [
            [6, 8],
            [1, 3],
            [3, 7],
          ],
        ],
        expected: [[1, 8]],
      },
      { args: [[]], expected: [] },
      {
        args: [
          [
            [1, 2],
            [4, 5],
          ],
        ],
        expected: [
          [1, 2],
          [4, 5],
        ],
      },
      {
        args: [
          [
            [1, 9],
            [2, 3],
          ],
        ],
        expected: [[1, 9]],
      },
    ],
  ),
  drill(
    "frequency",
    "Самое частое число",
    "Arrays & hashing",
    "Верните наиболее часто встречающееся целое число. При равных частотах выберите наименьшее число. Для пустого списка верните None.",
    "values",
    [
      "Подсчитайте частоту каждого числа.",
      "Сначала сравнивайте частоты, затем значения чисел.",
    ],
    [
      { args: [[7, 2, 7, 2, 9]], expected: 2 },
      { args: [[]], expected: null },
      { args: [[-1, -1, 0]], expected: -1 },
      { args: [[4]], expected: 4 },
    ],
  ),
];

// Curated link-only index. Titles identify originals; no external statements,
// solutions, premium content, company frequency or unsupported interview claims.
const sourceRows = `Arrays & hashing|Easy|two-sum
Arrays & hashing|Easy|contains-duplicate
Arrays & hashing|Easy|valid-anagram
Arrays & hashing|Medium|group-anagrams
Arrays & hashing|Medium|top-k-frequent-elements
Arrays & hashing|Medium|product-of-array-except-self
Arrays & hashing|Medium|valid-sudoku
Arrays & hashing|Medium|longest-consecutive-sequence
Two pointers|Easy|valid-palindrome
Two pointers|Medium|two-sum-ii-input-array-is-sorted
Two pointers|Medium|3sum
Two pointers|Medium|container-with-most-water
Two pointers|Hard|trapping-rain-water
Sliding window|Easy|best-time-to-buy-and-sell-stock
Sliding window|Medium|longest-substring-without-repeating-characters
Sliding window|Medium|longest-repeating-character-replacement
Sliding window|Medium|permutation-in-string
Sliding window|Hard|minimum-window-substring
Sliding window|Hard|sliding-window-maximum
Stack|Easy|valid-parentheses
Stack|Medium|min-stack
Stack|Medium|evaluate-reverse-polish-notation
Stack|Medium|generate-parentheses
Stack|Medium|daily-temperatures
Stack|Medium|car-fleet
Stack|Hard|largest-rectangle-in-histogram
Binary search|Easy|binary-search
Binary search|Medium|search-a-2d-matrix
Binary search|Medium|koko-eating-bananas
Binary search|Medium|find-minimum-in-rotated-sorted-array
Binary search|Medium|search-in-rotated-sorted-array
Binary search|Medium|time-based-key-value-store
Binary search|Hard|median-of-two-sorted-arrays
Linked lists|Easy|reverse-linked-list
Linked lists|Easy|merge-two-sorted-lists
Linked lists|Easy|linked-list-cycle
Linked lists|Medium|reorder-list
Linked lists|Medium|remove-nth-node-from-end-of-list
Linked lists|Medium|copy-list-with-random-pointer
Linked lists|Medium|add-two-numbers
Linked lists|Medium|lru-cache
Linked lists|Hard|merge-k-sorted-lists
Trees|Easy|invert-binary-tree
Trees|Easy|maximum-depth-of-binary-tree
Trees|Easy|diameter-of-binary-tree
Trees|Easy|balanced-binary-tree
Trees|Easy|same-tree
Trees|Easy|subtree-of-another-tree
Trees|Medium|lowest-common-ancestor-of-a-binary-search-tree
Trees|Medium|binary-tree-level-order-traversal
Trees|Medium|binary-tree-right-side-view
Trees|Medium|count-good-nodes-in-binary-tree
Trees|Medium|validate-binary-search-tree
Trees|Medium|kth-smallest-element-in-a-bst
Trees|Medium|construct-binary-tree-from-preorder-and-inorder-traversal
Trees|Hard|binary-tree-maximum-path-sum
Trees|Hard|serialize-and-deserialize-binary-tree
Heap|Easy|kth-largest-element-in-a-stream
Heap|Easy|last-stone-weight
Heap|Medium|k-closest-points-to-origin
Heap|Medium|kth-largest-element-in-an-array
Heap|Medium|task-scheduler
Heap|Hard|find-median-from-data-stream
Backtracking|Medium|subsets
Backtracking|Medium|combination-sum
Backtracking|Medium|permutations
Backtracking|Medium|subsets-ii
Backtracking|Medium|combination-sum-ii
Backtracking|Medium|word-search
Backtracking|Medium|palindrome-partitioning
Backtracking|Hard|n-queens
Graphs|Medium|number-of-islands
Graphs|Medium|max-area-of-island
Graphs|Medium|clone-graph
Graphs|Medium|pacific-atlantic-water-flow
Graphs|Medium|surrounded-regions
Graphs|Medium|rotting-oranges
Graphs|Medium|course-schedule
Graphs|Medium|course-schedule-ii
Graphs|Medium|redundant-connection
Graphs|Hard|word-ladder
Graphs|Medium|network-delay-time
Graphs|Medium|min-cost-to-connect-all-points
Graphs|Medium|cheapest-flights-within-k-stops
Dynamic programming|Easy|climbing-stairs
Dynamic programming|Easy|min-cost-climbing-stairs
Dynamic programming|Medium|house-robber
Dynamic programming|Medium|house-robber-ii
Dynamic programming|Medium|longest-palindromic-substring
Dynamic programming|Medium|palindromic-substrings
Dynamic programming|Medium|decode-ways
Dynamic programming|Medium|coin-change
Dynamic programming|Medium|maximum-product-subarray
Dynamic programming|Medium|word-break
Dynamic programming|Medium|longest-increasing-subsequence
Dynamic programming|Medium|partition-equal-subset-sum
Dynamic programming|Medium|unique-paths
Dynamic programming|Medium|longest-common-subsequence
Dynamic programming|Medium|best-time-to-buy-and-sell-stock-with-cooldown
Dynamic programming|Medium|coin-change-ii
Dynamic programming|Medium|target-sum
Dynamic programming|Medium|interleaving-string
Dynamic programming|Hard|distinct-subsequences
Dynamic programming|Medium|edit-distance
Dynamic programming|Hard|burst-balloons
Greedy|Medium|maximum-subarray
Greedy|Medium|jump-game
Greedy|Medium|jump-game-ii
Greedy|Medium|gas-station
Greedy|Medium|hand-of-straights
Greedy|Medium|partition-labels
Greedy|Medium|valid-parenthesis-string
Intervals|Medium|insert-interval
Intervals|Medium|merge-intervals
Intervals|Medium|non-overlapping-intervals
Intervals|Hard|minimum-interval-to-include-each-query
Math & bits|Easy|single-number
Math & bits|Easy|number-of-1-bits
Math & bits|Easy|counting-bits
Math & bits|Easy|reverse-bits
Math & bits|Easy|missing-number
Math & bits|Medium|sum-of-two-integers
Math & bits|Medium|reverse-integer
Math & bits|Medium|rotate-image
Math & bits|Medium|spiral-matrix
Math & bits|Medium|set-matrix-zeroes
Math & bits|Easy|happy-number
Math & bits|Easy|plus-one
Math & bits|Medium|powx-n
Math & bits|Medium|multiply-strings
Tries|Medium|implement-trie-prefix-tree
Tries|Medium|design-add-and-search-words-data-structure
Tries|Hard|word-search-ii
Arrays & hashing|Easy|contains-duplicate-ii
Two pointers|Easy|reverse-vowels-of-a-string
Arrays & hashing|Easy|majority-element
Arrays & hashing|Easy|intersection-of-two-arrays
Arrays & hashing|Easy|ransom-note
Arrays & hashing|Easy|isomorphic-strings
Two pointers|Easy|move-zeroes
Two pointers|Easy|merge-sorted-array
Binary search|Easy|search-insert-position
Binary search|Easy|first-bad-version
Stack|Easy|implement-queue-using-stacks
Trees|Easy|path-sum
Trees|Easy|symmetric-tree
Trees|Easy|minimum-depth-of-binary-tree
Graphs|Easy|flood-fill
Dynamic programming|Easy|fibonacci-number
Dynamic programming|Easy|n-th-tribonacci-number`;
export const catalog: Problem[] = [
  ...drills,
  ...sourceRows.split("\n").map((line) => {
    const [topic, difficulty, slug] = line.split("|");
    return {
      id: `lc-${slug}`,
      title:
        russianTitles[slug] ??
        slug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      topic,
      difficulty,
      url: `https://leetcode.com/problems/${slug}/`,
      starter:
        "# Прочитайте условие на сайте-источнике.\n# Напишите свой код на Python здесь.\n",
      hints: [],
    };
  }),
];
