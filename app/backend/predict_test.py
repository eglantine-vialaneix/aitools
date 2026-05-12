import json
import os
import sys
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")


LABEL_COLUMN = "régime_alimentaire"
DATA_ROOT = Path(__file__).resolve().parents[2] / "public" / "data"
DATA_FILES = {"df_train.csv", "df_train_partial.csv"}
TARGET_DATA_FILES = {"df_train.csv", "df_train_partial.csv", "df_test.csv"}
RANDOM_STATE = 15


def _json_value(value):
    if hasattr(value, "item"):
        return value.item()

    return value


def _records(df):
    return [
        {column: _json_value(value) for column, value in row.items()}
        for row in df.to_dict(orient="records")
    ]


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    features = payload.get("features", [])
    labels = payload.get("labels", {})
    data_file = payload.get("dataFile", "df_train.csv")
    target_file = payload.get("targetFile", "df_test.csv")

    if data_file not in DATA_FILES:
        data_file = "df_train.csv"

    if target_file not in TARGET_DATA_FILES:
        target_file = "df_test.csv"

    train_df = pd.read_csv(DATA_ROOT / data_file)
    target_df = pd.read_csv(DATA_ROOT / target_file)
    features = [feature for feature in features if feature in train_df.columns and feature in target_df.columns]

    if not features:
        features = [
            column
            for column in train_df.columns
            if column not in {LABEL_COLUMN, "nom"} and column in target_df.columns
        ]

    for name, diet in labels.items():
        if diet in {"herbivore", "carnivore"}:
            train_df.loc[train_df["nom"] == name, LABEL_COLUMN] = diet
            target_df.loc[target_df["nom"] == name, LABEL_COLUMN] = diet

    categorical_features = [
        feature
        for feature in features
        if (
            pd.api.types.is_bool_dtype(train_df[feature])
            or pd.api.types.is_string_dtype(train_df[feature])
            or pd.api.types.is_object_dtype(train_df[feature])
            or isinstance(train_df[feature].dtype, pd.CategoricalDtype)
        )
    ]
    numeric_features = [feature for feature in features if feature not in categorical_features]

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("numeric", "passthrough", numeric_features),
        ],
        remainder="drop",
    )
    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                DecisionTreeClassifier(
                    criterion="gini",
                    max_depth=3,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )

    model.fit(train_df[features], train_df[LABEL_COLUMN])

    result_df = target_df.copy()
    result_df["régime_alimentaire_prédit"] = model.predict(target_df[features])

    print(json.dumps({"features": features, "rows": _records(result_df)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
