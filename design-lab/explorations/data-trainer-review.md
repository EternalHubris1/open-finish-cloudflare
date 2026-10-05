# Data-analysis trainer extension — 2026-10-05

Authorized: user requested pandas/NumPy exercises plus Colab case work; prioritized functionality.

## Choice

Extend the existing focused trainer, not a second resource catalog. An explicit runtime selector loads only NumPy/pandas. Six runnable Russian exercises and two manual-review Colab capstones share the existing queue, attempts and review dates. No changes to API schema or other rooms.

Alternatives: server execution (security/operational expansion), all-Colab (unnecessary context switching), browser exercises + portable notebooks (selected). Large analytical work and plotting remain in Colab; no Google account integration or automatic result sync.

## Verification

- Typecheck and production Vite build passed.
- Browser: pandas filtering 3/3, NumPy normalization 4/4; actual library imports succeeded.
- Local pandas/NumPy: all 21 exercise fixtures match reference implementations.
- Eight exported notebook code-cell syntax checks passed; format is nbformat 4.4, no pre-executed outputs.
- Notebook export action shows instructions and preserves the draft. In-app automation did not deliver a download event, so actual file delivery in that browser is not claimed. Ordinary browser downloads and direct GitHub-backed Colab templates are the supported routes.
- Colab runtime not executed in a Google account; ML case runtime execution remains a manual smoke check. Missing notebook packages install from PyPI explicitly when the person runs its first cell.
- No design-language replacement, no changes to the Design Bible or approval log.

## Boundaries

Runtime selection on personal tasks is session-local. Browser execution uses a worker, not a security sandbox; arbitrary packages/URLs are never installed by the browser runner. Notebook export includes current task code and synthetic fixtures, never account history or secrets. Direct Colab links open original templates, not current unsaved site edits. General external task statements remain link-only.
