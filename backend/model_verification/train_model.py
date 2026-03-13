from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix
from sklearn.metrics import classification_report
from sklearn.model_selection import cross_val_score

import pandas as pd

df = pd.read_csv("D:\\Development\\VertAIx\\backend\\model_verification\\posture_dataset_1500.csv")

X = df[['neck_angle','shoulder_angle','spine_angle']]
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier()
model.fit(X_train, y_train)

import joblib
joblib.dump(model, "D:\\Development\\VertAIx\\backend\\posture_model.pkl")
print("Model saved to backend/posture_model.pkl")

pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, pred))
print("----------------------")
cm = confusion_matrix(y_test, pred)
print(cm)
print("----------------------")

print(classification_report(y_test, pred))

print("----------------------")         


scores = cross_val_score(model, X, y, cv=5)

print("Cross validation scores:", scores)
print("Average CV accuracy:", scores.mean())


