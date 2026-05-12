import json
import math
import os
import sys
from pathlib import Path

import pandas as pd

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

from tree_helpers import compute_all_ginis


LABEL_COLUMN = "régime_alimentaire"
DATA_ROOT = Path(__file__).resolve().parents[2] / "public" / "data"
DATA_FILES = {"df_train.csv", "df_train_partial.csv"}


def _json_value(value):
    if hasattr(value, "item"):
        return value.item()

    return value


def _format_criterion(value, is_numeric):
    value = _json_value(value)

    if isinstance(value, float) and math.isfinite(value):
        value = round(value, 3)

    return f">= {value}" if is_numeric else f"= {value}"


def _mask_for_split(df, feature, operator, value):
    if operator == "gte":
        return df[feature] >= value

    if operator == "eq":
        return df[feature] == value

    raise ValueError(f"Unsupported operator: {operator}")


def _apply_filters(df, filters):
    filtered = df

    for condition in filters:
        feature = condition.get("feature")
        operator = condition.get("operator")
        value = condition.get("value")
        branch = condition.get("branch")

        if feature not in filtered.columns or branch not in {"yes", "no"}:
            continue

        mask = _mask_for_split(filtered, feature, operator, value)
        filtered = filtered[mask] if branch == "yes" else filtered[~mask]

    return filtered


def _counts(df):
    carnivores = int((df[LABEL_COLUMN] == "carnivore").sum())
    herbivores = int((df[LABEL_COLUMN] == "herbivore").sum())
    majority = "carnivore" if carnivores >= herbivores else "herbivore"

    return {
        "total": int(df.shape[0]),
        "carnivores": carnivores,
        "herbivores": herbivores,
        "majority": majority,
        "isPure": carnivores == 0 or herbivores == 0,
    }


def _node_impurity_score(df):
    counts = _counts(df)
    carnivores = counts["carnivores"]
    herbivores = counts["herbivores"]
    total = counts["total"]

    if total == 0:
        return 0.0

    return (carnivores * herbivores) / total


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    features = payload.get("features", [])
    labels = payload.get("labels", {})
    filters = payload.get("filters", [])
    data_file = payload.get("dataFile", "df_train.csv")

    if data_file not in DATA_FILES:
        data_file = "df_train.csv"

    df = pd.read_csv(DATA_ROOT / data_file)

    for name, diet in labels.items():
        if diet in {"herbivore", "carnivore"}:
            df.loc[df["nom"] == name, LABEL_COLUMN] = diet

    df = _apply_filters(df, filters)
    results = []

    for feature in features:
        if feature not in df.columns:
            continue

        values, ginis = compute_all_ginis(df, feature)
        finite_pairs = [
            (value, float(gini))
            for value, gini in zip(values, ginis)
            if math.isfinite(float(gini))
        ]
        is_numeric = pd.api.types.is_numeric_dtype(df[feature]) and not pd.api.types.is_bool_dtype(df[feature])

        if not finite_pairs:
            fallback_value = _json_value(values[0]) if len(values) else ""
            results.append(
                {
                    "feature": feature,
                    "gini": _node_impurity_score(df),
                    "criterion": _format_criterion(fallback_value, is_numeric),
                    "operator": "gte" if is_numeric else "eq",
                    "value": fallback_value,
                    "yes": _counts(df),
                    "no": _counts(df.iloc[0:0]),
                    "isSplittable": False,
                }
            )
            continue

        best_value, best_gini = min(finite_pairs, key=lambda pair: pair[1])
        operator = "gte" if is_numeric else "eq"
        split_mask = _mask_for_split(df, feature, operator, best_value)
        yes_df = df[split_mask]
        no_df = df[~split_mask]
        json_value = _json_value(best_value)

        results.append(
            {
                "feature": feature,
                "gini": best_gini,
                "criterion": _format_criterion(best_value, is_numeric),
                "operator": operator,
                "value": json_value,
                "yes": _counts(yes_df),
                "no": _counts(no_df),
                "isSplittable": True,
            }
        )

    print(json.dumps({"counts": _counts(df), "results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
