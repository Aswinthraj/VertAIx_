import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = BASE_DIR / "posture_dataset_real_2000.csv"
DEFAULT_MODEL = BASE_DIR.parent / "posture_model.pkl"
FEATURE_COLUMNS = ["neck_angle", "shoulder_angle", "spine_angle"]

def main():
	parser = argparse.ArgumentParser(description="Train the VertAIx posture classifier")
	parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
	parser.add_argument("--model-output", type=Path, default=DEFAULT_MODEL)
	args = parser.parse_args()

	dataset = pd.read_csv(args.dataset)
	required_columns = FEATURE_COLUMNS + ["label"]
	missing_columns = set(required_columns) - set(dataset.columns)
	if missing_columns:
		raise ValueError(f"Dataset is missing columns: {sorted(missing_columns)}")

	dataset = dataset[required_columns].dropna()
	X = dataset[FEATURE_COLUMNS]
	y = dataset["label"]

	X_train, X_test, y_train, y_test = train_test_split(
		X,
		y,
		test_size=0.2,
		random_state=42,
		stratify=y,
	)

	model = RandomForestClassifier(
		n_estimators=300,
		random_state=42,
		n_jobs=-1,
	)
	model.fit(X_train, y_train)

	args.model_output.parent.mkdir(parents=True, exist_ok=True)
	joblib.dump(model, args.model_output)

	predictions = model.predict(X_test)
	print(f"Dataset: {args.dataset}")
	print(f"Rows: {len(dataset)}")
	print(f"Model saved: {args.model_output}")
	print(f"Test accuracy: {accuracy_score(y_test, predictions):.4f}")
	print("Confusion matrix [Bad, Good]:")
	print(confusion_matrix(y_test, predictions, labels=["Bad", "Good"]))
	print(classification_report(y_test, predictions, zero_division=0))

	cross_validator = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
	scores = cross_val_score(model, X, y, cv=cross_validator, n_jobs=-1)
	print(f"Cross-validation scores: {scores}")
	print(f"Cross-validation mean: {scores.mean():.4f}")
	print(f"Cross-validation std: {scores.std():.4f}")

if __name__ == "__main__":
	main()


