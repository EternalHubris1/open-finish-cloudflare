// Only the person's own code is executed. No repository code is fetched or run.
// A worker keeps Python off the UI thread; it is not a hostile-code security boundary.
const runtimeBase = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
type Runtime = {
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (names: string[]) => Promise<unknown>;
};
let output = "";
const emit = (line: string) => {
  if (output.length < 12000)
    output += `${line}\n`.slice(0, 12000 - output.length);
};
const scope = globalThis as unknown as {
  onmessage: (event: MessageEvent) => void;
  postMessage: (value: unknown) => void;
};
scope.onmessage = async (event) => {
  try {
    scope.postMessage({ phase: "loading" });
    const runtimeUrl = `${runtimeBase}pyodide.mjs`;
    const { loadPyodide } = await import(/* @vite-ignore */ runtimeUrl);
    const python: Runtime = await loadPyodide({
      indexURL: runtimeBase,
      stdout: emit,
      stderr: emit,
      stdin: () => null,
    });
    const { code, tests, packages = [] } = event.data;
    // Explicit allowlist: never install arbitrary packages or scan user imports.
    if (
      !Array.isArray(packages) ||
      packages.some((name) => !["numpy", "pandas"].includes(name))
    )
      throw new Error(
        "Выберите поддерживаемую среду: Python, NumPy или pandas.",
      );
    if (packages.length) {
      scope.postMessage({
        phase: "loading",
        detail: `Загрузка ${packages.join(" + ")}…`,
      });
      await python.loadPackage(packages);
    }
    scope.postMessage({ phase: "running" });
    output = "";
    const harness = tests
      ? `
import json as _dojo_json
_dojo_cases = _dojo_json.loads(${JSON.stringify(JSON.stringify(tests))})
_dojo_results = []
for _dojo_case in _dojo_cases:
    try:
        _dojo_actual = solve(*_dojo_case["args"])
        _dojo_results.append({"passed": _dojo_actual == _dojo_case["expected"], "actual": repr(_dojo_actual)[:500]})
    except Exception as _dojo_error:
        _dojo_results.append({"passed": False, "actual": str(_dojo_error)[:500]})
_dojo_json.dumps(_dojo_results)
`
      : "";
    const result = await python.runPythonAsync(`${code}\n${harness}`);
    scope.postMessage({
      phase: "done",
      output,
      results: tests ? JSON.parse(String(result)) : null,
    });
  } catch (error) {
    scope.postMessage({
      phase: "error",
      output,
      error:
        error instanceof Error
          ? error.message.slice(0, 2000)
          : "Python could not start.",
    });
  }
};
export {};
