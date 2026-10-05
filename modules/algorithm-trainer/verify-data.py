"""Optional local fixture/notebook verification; requires pandas and NumPy.

Feed {problems, notebooks} JSON on stdin. No account data or files are modified.
"""
import ast
import json
import sys
import numpy as np
import pandas as pd


def filter_orders(rows, threshold):
    frame = pd.DataFrame(rows, columns=["id", "amount", "paid"])
    return frame.loc[(frame["paid"] == True) & (frame["amount"] >= threshold), "id"].sort_values().tolist()


def revenue(rows):
    if not rows:
        return []
    return [[category, int(total)] for category, total in pd.DataFrame(rows).groupby("category")["revenue"].sum().sort_index().items()]


def missing(values):
    series = pd.Series(values, dtype=float)
    return series.fillna(series.median() if series.notna().any() else 0).tolist()


def join_orders(orders, customers):
    left = pd.DataFrame(orders, columns=["order_id", "customer_id"])
    right = pd.DataFrame(customers, columns=["customer_id", "name"])
    # pandas 3 empty object columns may differ from numeric join-key dtypes.
    if not customers:
        return [[row["order_id"], "Неизвестно"] for row in sorted(orders, key=lambda row: row["order_id"])]
    frame = left.merge(right, on="customer_id", how="left").sort_values("order_id")
    frame["name"] = frame["name"].fillna("Неизвестно")
    return frame[["order_id", "name"]].values.tolist()


def normalize(values):
    array = np.asarray(values, dtype=float)
    if not array.size:
        return []
    span = array.max() - array.min()
    return np.zeros_like(array).tolist() if not span else np.round((array-array.min())/span, 6).tolist()


def means(matrix):
    array = np.asarray(matrix, dtype=float)
    return np.round(array.mean(axis=0), 6).tolist() if array.size else []


references = {
    "dojo-data-filter": filter_orders,
    "dojo-data-group": revenue,
    "dojo-data-missing": missing,
    "dojo-data-join": join_orders,
    "dojo-data-normalize": normalize,
    "dojo-data-column-means": means,
}
payload = json.load(sys.stdin)
count = 0
for problem in payload["problems"]:
    if problem.get("colabOnly"):
        continue
    for case in problem["tests"]:
        actual = references[problem["id"]](*case["args"])
        assert actual == case["expected"], (problem["id"], actual, case["expected"])
        count += 1
for notebook in payload["notebooks"]:
    assert notebook["nbformat"] == 4 and notebook["nbformat_minor"] == 4
    for cell in notebook["cells"]:
        if cell["cell_type"] == "code":
            ast.parse(cell["source"])
print(f"Verified {count} fixtures and {len(payload['notebooks'])} notebook Python syntax checks")
