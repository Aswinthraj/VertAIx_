import pandas as pd

df = pd.read_csv("posture_dataset.csv")
print(df['label'].value_counts())