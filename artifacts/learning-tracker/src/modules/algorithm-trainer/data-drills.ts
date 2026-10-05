import type { Problem } from "./catalog.ts";

// Original exercises and tiny synthetic datasets; no account data leaves the site.
export const dataDrills: Problem[] = [
  {
    id: "dojo-data-sales-case",
    title: "Кейс: анализ продаж и качества данных",
    topic: "pandas",
    difficulty: "Medium",
    track: "data",
    colabOnly: true,
    statement:
      "Полноценный кейс для Colab. В ноутбуке генерируются 1000 синтетических заказов с фиксированным seed, повторами и пропусками. Проверьте качество данных, удалите дубли order_id, обоснуйте обработку пропусков, рассчитайте выручку и средний чек по месяцам и категориям, визуализируйте динамику и запишите 3 вывода с ограничениями анализа. Результат оценивается вами вручную, не локальными тестами.",
    starter:
      "# orders — DataFrame, создаётся в предыдущей ячейке ноутбука\n# 1. Диагностика качества\nprint(orders.head())\n# 2. Очистка и агрегация\n# 3. Графики и выводы\n",
    hints: [
      "Различайте отсутствие значения и нулевую выручку.",
      "Проверьте количество строк до и после очистки, отдельно объясните удалённые записи.",
    ],
    notebookSetup:
      "rng = np.random.default_rng(42)\norders = pd.DataFrame({'order_id': np.arange(1000), 'date': pd.Timestamp('2026-01-01') + pd.to_timedelta(rng.integers(0, 180, 1000), unit='D'), 'category': rng.choice(['books', 'tools', 'courses'], 1000), 'amount': np.round(rng.uniform(10, 500, 1000), 2)})\norders.loc[rng.choice(1000, 40, replace=False), 'amount'] = np.nan\norders = pd.concat([orders, orders.iloc[:25]], ignore_index=True)\nprint('Исходных строк:', len(orders))\n",
  },
  {
    id: "dojo-data-ml-case",
    title: "Кейс: честная оценка ML-модели",
    topic: "ML / scikit-learn",
    difficulty: "Medium",
    track: "data",
    colabOnly: true,
    statement:
      "В Colab создаётся синтетическая задача бинарной классификации: 1200 объектов, 12 признаков, фиксированный seed. Отделите тестовую выборку до обучения и предобработки. Постройте baseline и Pipeline со StandardScaler и LogisticRegression. Сравните accuracy, precision, recall и ROC AUC, покажите confusion matrix. Объясните ошибки модели, риск утечки и выбор порога. Итог отмечается вручную.",
    starter:
      "# X и y создаются в предыдущей ячейке ноутбука\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\n\n# Сначала выделите тестовую выборку; затем обучайте только на train\n",
    hints: [
      "Используйте stratify=y и random_state=42 при разделении.",
      "ROC AUC рассчитывается по вероятностям, не бинарным меткам. Не подбирайте порог на тестовой выборке.",
    ],
    notebookSetup:
      "from sklearn.datasets import make_classification\nX, y = make_classification(n_samples=1200, n_features=12, n_informative=6, weights=[0.7, 0.3], random_state=42)\nprint('Размер данных:', X.shape)\n",
  },
  {
    id: "dojo-data-filter",
    title: "Фильтрация заказов",
    topic: "pandas",
    difficulty: "Easy",
    track: "data",
    packages: ["numpy", "pandas"],
    statement:
      "Дан список заказов с полями id, amount и paid. Через pandas выберите оплаченные заказы с amount >= threshold. Верните их id по возрастанию как обычный Python-список. Пустой вход возвращает [].",
    starter:
      "import pandas as pd\n\ndef solve(rows, threshold):\n    # Создайте DataFrame и отфильтруйте строки\n    pass\n",
    hints: [
      "Используйте булеву маску и оператор & с отдельными скобками.",
      "Отсортируйте id и вызовите .tolist(). Пустые данные обработайте отдельно.",
    ],
    tests: [
      {
        args: [
          [
            { id: 3, amount: 100, paid: true },
            { id: 1, amount: 150, paid: true },
            { id: 2, amount: 200, paid: false },
          ],
          100,
        ],
        expected: [1, 3],
      },
      { args: [[], 0], expected: [] },
      { args: [[{ id: 1, amount: 99, paid: true }], 100], expected: [] },
    ],
  },
  {
    id: "dojo-data-group",
    title: "Выручка по категориям",
    topic: "pandas",
    difficulty: "Easy",
    track: "data",
    packages: ["numpy", "pandas"],
    statement:
      "Даны записи category и revenue. Через pandas подсчитайте сумму revenue в каждой категории. Верните список пар [category, сумма], отсортированный по названию категории. Пустой вход возвращает [].",
    starter: "import pandas as pd\n\ndef solve(rows):\n    pass\n",
    hints: [
      "Используйте groupby('category')['revenue'].sum().",
      "Преобразуйте итог в список обычных Python-значений, а не DataFrame.",
    ],
    tests: [
      {
        args: [
          [
            { category: "books", revenue: 12 },
            { category: "tools", revenue: 8 },
            { category: "books", revenue: 5 },
          ],
        ],
        expected: [
          ["books", 17],
          ["tools", 8],
        ],
      },
      { args: [[]], expected: [] },
      {
        args: [
          [
            { category: "a", revenue: -2 },
            { category: "a", revenue: 2 },
          ],
        ],
        expected: [["a", 0]],
      },
    ],
  },
  {
    id: "dojo-data-missing",
    title: "Заполнение пропусков медианой",
    topic: "pandas",
    difficulty: "Easy",
    track: "data",
    packages: ["numpy", "pandas"],
    statement:
      "В списке чисел None обозначает пропуск. Через pandas замените пропуски медианой известных значений. Если известных значений нет, используйте 0. Верните обычный список чисел; пустой вход возвращает [].",
    starter: "import pandas as pd\n\ndef solve(values):\n    pass\n",
    hints: [
      "Создайте Series с числовым dtype.",
      "Проверьте наличие известных значений перед median(), затем используйте fillna().",
    ],
    tests: [
      { args: [[2, null, 8]], expected: [2, 5, 8] },
      { args: [[null, null]], expected: [0, 0] },
      { args: [[]], expected: [] },
      { args: [[1, 2, null, 9, 10]], expected: [1, 2, 5.5, 9, 10] },
    ],
  },
  {
    id: "dojo-data-join",
    title: "Объединение заказов и клиентов",
    topic: "pandas",
    difficulty: "Medium",
    track: "data",
    packages: ["numpy", "pandas"],
    statement:
      "Заказы содержат order_id и customer_id, клиенты — customer_id и name. Идентификаторы клиентов уникальны. Через pandas выполните левое соединение. Верните пары [order_id, name], отсортированные по order_id. Для отсутствующего клиента используйте строку 'Неизвестно'. Если заказов нет, верните [].",
    starter: "import pandas as pd\n\ndef solve(orders, customers):\n    pass\n",
    hints: [
      "Укажите columns при создании DataFrame, чтобы пустой список клиентов сохранил схему.",
      "Используйте merge(..., how='left'), затем fillna() для имени.",
    ],
    tests: [
      {
        args: [
          [
            { order_id: 2, customer_id: 8 },
            { order_id: 1, customer_id: 7 },
          ],
          [{ customer_id: 7, name: "Анна" }],
        ],
        expected: [
          [1, "Анна"],
          [2, "Неизвестно"],
        ],
      },
      { args: [[], []], expected: [] },
      {
        args: [[{ order_id: 1, customer_id: 7 }], []],
        expected: [[1, "Неизвестно"]],
      },
    ],
  },
  {
    id: "dojo-data-normalize",
    title: "Min–max нормализация",
    topic: "NumPy",
    difficulty: "Easy",
    track: "data",
    packages: ["numpy"],
    statement:
      "Через NumPy преобразуйте каждое число по формуле (x - min) / (max - min). Если все числа одинаковы, верните нули. Округлите результат до 6 знаков и верните обычный список. Пустой вход возвращает [].",
    starter: "import numpy as np\n\ndef solve(values):\n    pass\n",
    hints: [
      "Создайте массив с dtype=float и проверьте его размер.",
      "Обработайте нулевой размах отдельно; используйте np.round(..., 6).tolist().",
    ],
    tests: [
      { args: [[10, 15, 20]], expected: [0, 0.5, 1] },
      { args: [[3, 3]], expected: [0, 0] },
      { args: [[]], expected: [] },
      { args: [[-3, -2, 0]], expected: [0, 0.333333, 1] },
    ],
  },
  {
    id: "dojo-data-column-means",
    title: "Средние значения столбцов",
    topic: "NumPy",
    difficulty: "Easy",
    track: "data",
    packages: ["numpy"],
    statement:
      "Дана прямоугольная числовая матрица без пропусков. Через NumPy найдите среднее каждого столбца, округлите до 6 знаков и верните обычный список. Для пустой матрицы или нулевого числа столбцов верните [].",
    starter: "import numpy as np\n\ndef solve(matrix):\n    pass\n",
    hints: [
      "Среднее по строкам для каждого столбца задаётся axis=0.",
      "Для пустого массива не вызывайте mean(); результат переведите в .tolist().",
    ],
    tests: [
      {
        args: [
          [
            [1, 4],
            [3, 8],
          ],
        ],
        expected: [2, 6],
      },
      { args: [[]], expected: [] },
      { args: [[[], []]], expected: [] },
      { args: [[[1, 2, 3]]], expected: [1, 2, 3] },
    ],
  },
];
