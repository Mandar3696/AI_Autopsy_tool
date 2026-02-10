print("✅ predict.py started")

import tensorflow as tf
import numpy as np
import json
import sys
import cv2
from tensorflow.keras.preprocessing import image
from backend.gradcam import make_gradcam_heatmap

# ---------------- CONFIG ----------------
MODEL_PATH = "model/ai_vs_real_model.h5"
CLASS_INDEX_PATH = "model/class_indices.json"
IMG_SIZE = (224, 224)
LAST_CONV_LAYER = "Conv_1"  # MobileNetV2 fixed layer

# ---------------- LOAD MODEL ----------------
model = tf.keras.models.load_model(MODEL_PATH)
print("Model output shape:", model.output_shape)

with open(CLASS_INDEX_PATH, "r") as f:
    class_indices = json.load(f)

idx_to_class = {v: k for k, v in class_indices.items()}

# ---------------- PREDICTION FUNCTION ----------------
def predict_image(img_path, generate_heatmap=True):
    # Load image
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    preds = model.predict(img_array)[0]
    ai_prob = float(preds[0])
    real_prob = float(preds[1])
    confidence = max(ai_prob, real_prob)

    # Verdict logic
    if 0.45 <= real_prob <= 0.60:
        verdict = "Inconclusive (Hard AI Case)"
        risk = "Medium"
    elif real_prob > ai_prob:
        verdict = "Real Photograph"
        risk = "Low"
    else:
        verdict = "AI Generated"
        risk = "High"

    # Print result
    print("\n🖼 Image:", img_path)
    print("🧠 Verdict:", verdict)
    print("🔎 Risk Level:", risk)
    print("📊 Confidence:", round(confidence, 2))
    print("\nClass Probabilities:")
    print("  ai:", round(ai_prob, 2))
    print("  real:", round(real_prob, 2))

    # ---------------- GRAD-CAM ----------------
    if generate_heatmap:
        try:
            heatmap = make_gradcam_heatmap(
                img_array, model, LAST_CONV_LAYER
            )

            original_img = cv2.imread(img_path)
            original_img = cv2.resize(original_img, IMG_SIZE)

            heatmap = cv2.resize(heatmap, IMG_SIZE)
            heatmap = np.uint8(255 * heatmap)
            heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

            superimposed = cv2.addWeighted(
                original_img, 0.6, heatmap, 0.4, 0
            )

            cv2.imwrite("gradcam_output.jpg", superimposed)
            print("🔥 Grad-CAM saved as gradcam_output.jpg")

        except Exception as e:
            print("⚠️ Grad-CAM failed:", str(e))


# ---------------- MAIN ----------------
if __name__ == "__main__":
    print("✅ main block running")

    if len(sys.argv) != 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    predict_image(sys.argv[1])
