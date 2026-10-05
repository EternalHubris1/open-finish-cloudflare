import type { Problem } from "./catalog.ts";

export function practiceNotebook(problem: Problem, code: string) {
  const markdown = (source: string) => ({
    cell_type: "markdown",
    metadata: {},
    source,
  });
  const cell = (source: string) => ({
    cell_type: "code",
    execution_count: null,
    metadata: {},
    outputs: [],
    source,
  });
  const tests = JSON.stringify(problem.tests ?? []);
  return {
    nbformat: 4,
    nbformat_minor: 4,
    metadata: {
      colab: { name: `${problem.id}.ipynb` },
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: { name: "python" },
    },
    cells: [
      markdown(
        `# ${problem.title}\n\n${problem.statement ?? "Прочитайте условие на сайте-источнике."}\n\n${problem.url ? `Источник: ${problem.url}\n\n` : ""}Данные примеров синтетические. Выполните ячейки сверху вниз. Результат отметьте на сайте вручную: автоматической синхронизации с Colab нет.\n\nВерните из solve обычные Python-списки, числа или словари; используйте .tolist() для NumPy и pandas.`,
      ),
      cell(
        "# Установить только отсутствующие библиотеки из PyPI\nimport importlib.util\nimport subprocess\nimport sys\npackages = {'numpy': 'numpy', 'pandas': 'pandas', 'matplotlib': 'matplotlib', 'sklearn': 'scikit-learn'}\nmissing = [package for module, package in packages.items() if importlib.util.find_spec(module) is None]\nif missing:\n    subprocess.check_call([sys.executable, '-m', 'pip', 'install', *missing])\nimport numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n",
      ),
      ...(problem.notebookSetup ? [cell(problem.notebookSetup)] : []),
      cell(code),
      cell(
        `import json\ncases = json.loads(${JSON.stringify(tests)})\npassed = 0\nfor i, case in enumerate(cases, 1):\n    try:\n        actual = solve(*case['args'])\n        ok = actual == case['expected']\n        passed += bool(ok)\n        print(f\"{'✓' if ok else '×'} Тест {i}: {actual!r}; ожидается {case['expected']!r}\")\n    except Exception as error:\n        print(f'× Тест {i}: {error}')\nprint(f'Пройдено: {passed}/{len(cases)}' if cases else 'Локальных тестов нет: проверьте решение на источнике.')\nassert passed == len(cases), 'Есть непройденные тесты'\n`,
      ),
      markdown(
        "## Исследование данных\n\nНиже можно добавить свои ячейки, CSV, графики и ML-эксперименты. Не загружайте чувствительные данные в публичные ноутбуки.",
      ),
      cell(
        "# Пример графика на синтетических данных\n# pd.Series([2, 5, 3, 8]).plot(title='Пример')\n# plt.show()\n",
      ),
    ],
  };
}
