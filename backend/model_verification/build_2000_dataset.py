from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
SOURCE_DATASET = BASE_DIR / "posture_dataset_1500.csv"
EXTRA_LOGS = BASE_DIR.parent / "posture_dataset.csv"
OUTPUT_DATASET = BASE_DIR / "posture_dataset_2000.csv"
FEATURE_COLUMNS = ["neck_angle", "shoulder_angle", "spine_angle"]
REQUIRED_COLUMNS = FEATURE_COLUMNS + ["label"]


def load_dataset(path: Path) -> pd.DataFrame:
    dataset = pd.read_csv(path)
    missing_columns = set(REQUIRED_COLUMNS) - set(dataset.columns)
    if missing_columns:
        raise ValueError(f"{path} is missing columns: {sorted(missing_columns)}")

    dataset = dataset[REQUIRED_COLUMNS].copy()
    dataset[FEATURE_COLUMNS] = dataset[FEATURE_COLUMNS].apply(pd.to_numeric, errors="coerce")
    dataset["label"] = dataset["label"].astype(str).str.strip()
    if dataset[REQUIRED_COLUMNS].isna().any().any():
        raise ValueError(f"{path} contains incomplete rows")
    return dataset


def main() -> None:
    base_dataset = load_dataset(SOURCE_DATASET)
    extra_logs = load_dataset(EXTRA_LOGS)

    selected_extra = pd.concat(
        [
            extra_logs[extra_logs["label"] == "Good"].head(250),
            extra_logs[extra_logs["label"] == "Bad"].head(250),
        ],
        ignore_index=True,
    )
    if len(selected_extra) != 500:
        raise ValueError(
            "Need at least 250 Good and 250 Bad extra logs; "
            f"found {len(selected_extra)} selected"
        )

    combined = pd.concat([base_dataset, selected_extra], ignore_index=True)
    combined.to_csv(OUTPUT_DATASET, index=False)
    print(f"Created {OUTPUT_DATASET} with {len(combined)} rows")
    print(combined["label"].value_counts().sort_index().to_string())


if __name__ == "__main__":
    main()