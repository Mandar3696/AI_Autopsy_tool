from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
import json, io, base64
from PIL import Image
import cv2

# -------------------- APP SETUP --------------------
app = FastAPI(title="AI Autopsy API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- LOAD MODEL --------------------
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "model", "ai_vs_real_model.h5")
CLASS_JSON = os.path.join(BASE_DIR, "model", "class_indices.json")


model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_JSON, "r") as f:
    labels = json.load(f)

# Reverse labels if needed
labels = {int(v): k.lower() for k, v in labels.items()}

# -------------------- CONSTANTS --------------------
IMG_SIZE = 224
LAST_CONV_LAYER = None  # auto-detect

# -------------------- UTILITIES --------------------
def preprocess_image(image: Image.Image):
    image = image.resize((IMG_SIZE, IMG_SIZE))
    img = np.array(image) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def get_last_conv_layer(model):
    for layer in reversed(model.layers):
        if len(layer.output_shape) == 4:
            return layer.name
    return None

LAST_CONV_LAYER = get_last_conv_layer(model)

def get_severity(ai_prob):
    if ai_prob > 85:
        return "High"
    elif ai_prob > 60:
        return "Medium"
    return "Low"

def generate_gradcam(image, model, class_index):
    try:
        grad_model = tf.keras.models.Model(
            [model.inputs],
            [model.get_layer(LAST_CONV_LAYER).output, model.output]
        )

        img_array = preprocess_image(image)

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(img_array)
            loss = predictions[:, class_index]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_outputs = conv_outputs[0]

        heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1)
        heatmap = np.maximum(heatmap, 0)
        heatmap /= np.max(heatmap) + 1e-8

        heatmap = cv2.resize(heatmap, image.size)
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        image_np = np.array(image)
        overlay = cv2.addWeighted(image_np, 0.6, heatmap, 0.4, 0)

        _, buffer = cv2.imencode(".png", overlay)
        return base64.b64encode(buffer).decode("utf-8")

    except Exception:
        return None

# -------------------- ROUTES --------------------
@app.get("/")
def home():
    return {"status": "AI Autopsy API running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        img_array = preprocess_image(image)
        preds = model.predict(img_array)[0]

        pred_index = int(np.argmax(preds))
        pred_label = labels[pred_index]
        confidence = float(preds[pred_index] * 100)

        ai_index = None
        for k, v in labels.items():
            if v == "ai":
                ai_index = k
                break

        ai_prob = float(preds[ai_index] * 100) if ai_index is not None else 0.0
        severity = get_severity(ai_prob)

        heatmap = generate_gradcam(image, model, pred_index)

        return {
            "verdict": "AI Generated" if pred_label == "ai" else "Real Image",
            "confidence": round(confidence, 2),
            "severity": severity,
            "probabilities": {
                labels[i]: round(float(preds[i]) * 100, 2)
                for i in range(len(preds))
            },
            "heatmap": heatmap,
            "disclaimer": "This result is AI-assisted and not legally binding."
        }

    except Exception as e:
        return {
            "error": "Prediction failed",
            "details": str(e)
        }
