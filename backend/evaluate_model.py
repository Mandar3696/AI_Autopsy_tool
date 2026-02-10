import tensorflow as tf
import numpy as np
import os
import json
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Paths
MODEL_PATH = "model/ai_vs_real_model.keras"
DATASET_DIR = "dataset"
IMG_SIZE = (224, 224)
BATCH_SIZE = 16

# Load model
model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Model loaded")

# Data generator (NO augmentation for evaluation)
datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

val_data = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

# Load class labels
class_labels = list(val_data.class_indices.keys())
print("Classes:", class_labels)

# Predictions
pred_probs = model.predict(val_data)
y_pred = np.argmax(pred_probs, axis=1)
y_true = val_data.classes

print("Unique y_true:", np.unique(y_true))
print("Unique y_pred:", np.unique(y_pred))

# Classification report
print("\n📊 Classification Report:\n")
labels = sorted(list(set(y_true)))
filtered_class_names = [class_labels[i] for i in labels]


print(classification_report(
    y_true,
    y_pred,
    labels=labels,
    target_names=filtered_class_names
))

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)

plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d',
            xticklabels=class_labels,
            yticklabels=class_labels,
            cmap='Blues')

plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.tight_layout()
plt.savefig("model/confusion_matrix.png")
plt.show()

print("✅ Confusion matrix saved to model/confusion_matrix.png")
