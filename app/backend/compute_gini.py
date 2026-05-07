import json
import math
import os
import sys
from pathlib import Path

import pandas as pd

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")

from tree_helpers import _compute_all_ginis


LABEL_COLUMN = "régime_alimentaire"
DATA_PATH = Path(__file__).resolve().parents[2] / "public" / "data" / "df_train.csv"


def _json_value(value):
    if hasattr(value, "item"):
        return value.item()

    return value


def _format_criterion(value, is_numeric):
    value = _json_value(value)

    if isinstance(value, float) and math.isfinite(value):
        value = round(value, 3)

    return f">= {value}" if is_numeric else f"= {value}"


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    features = payload.get("features", [])
    labels = payload.get("labels", {})

    df = pd.read_csv(DATA_PATH)

    for name, diet in labels.items():
        if diet in {"herbivore", "carnivore"}:
            df.loc[df["nom"] == name, LABEL_COLUMN] = diet

    results = []

    for feature in features:
        if feature not in df.columns:
            continue

        values, ginis = _compute_all_ginis(df, feature)
        finite_pairs = [
            (value, float(gini))
            for value, gini in zip(values, ginis)
            if math.isfinite(float(gini))
        ]

        if not finite_pairs:
            continue

        best_value, best_gini = min(finite_pairs, key=lambda pair: pair[1])
        is_numeric = pd.api.types.is_numeric_dtype(df[feature]) and not pd.api.types.is_bool_dtype(df[feature])

        results.append(
            {
                "feature": feature,
                "gini": best_gini,
                "criterion": _format_criterion(best_value, is_numeric),
            }
        )

    print(json.dumps({"results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
