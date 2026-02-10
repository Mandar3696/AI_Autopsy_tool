import streamlit as st
import tensorflow as tf
import json
import numpy as np
from PIL import Image
import base64
import time
import cv2

# ---------------- SEVERITY LOGIC ----------------
def get_severity(ai_prob):
    if ai_prob < 50:
        return "Low", "#22c55e"
    elif ai_prob < 65:
        return "Moderate", "#facc15"
    elif ai_prob < 80:
        return "High", "#fb923c"
    else:
        return "Extreme", "#ef4444"

# ---------------- PAGE CONFIG ----------------
st.set_page_config(
    page_title="AI Autopsy Tool",
    layout="centered"
)

# ---------------- ICON HELPER ----------------
def icon_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

ICON_AI = icon_base64("assets/ai-robot.png")
ICON_WARN = icon_base64("assets/limitation.png")

# ---------------- CUSTOM CSS ----------------
st.markdown("""
<style>
body { background-color: #0e1117; }

.box {
    background-color: #111827;
    padding: 20px;
    border-radius: 14px;
    border: 1px solid #2a2f3a;
    margin-bottom: 25px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.section-header img {
    width: 22px;
    height: 22px;
}

.result-ai { color: #ff6b6b; font-weight: bold; }
.result-real { color: #4cd964; font-weight: bold; }

.small-text {
    color: #9ca3af;
    font-size: 14px;
}
</style>
""", unsafe_allow_html=True)

# ---------------- HEADER ----------------
logo = Image.open("assets/project logo1.png")
st.markdown("<div style='text-align:center'>", unsafe_allow_html=True)
st.image(logo, width=140)
st.markdown("<h1>AI Autopsy Tool</h1>", unsafe_allow_html=True)
st.markdown(
    "<p class='small-text'>Explainable AI system for detecting AI-generated images</p>",
    unsafe_allow_html=True
)
st.markdown("</div>", unsafe_allow_html=True)
st.markdown("---")

# ---------------- MODEL CONFIG ----------------
MODEL_PATH = "model/ai_vs_real_model.h5"
CLASS_JSON = "model/class_indices.json"
IMG_SIZE = (224, 224)

@st.cache_resource
def load_model():
    return tf.keras.models.load_model(MODEL_PATH)

model = load_model()

with open(CLASS_JSON, "r") as f:
    class_indices = json.load(f)

labels = {v: k for k, v in class_indices.items()}

# ---------------- GRAD-CAM ----------------
def generate_gradcam(img_array, model, pred_index):
    last_conv_layer = model.get_layer("Conv_1")

    grad_model = tf.keras.models.Model(
        model.inputs,
        [last_conv_layer.output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, pred_index]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)

    heatmap = np.maximum(heatmap, 0)
    heatmap /= np.max(heatmap) if np.max(heatmap) != 0 else 1

    return heatmap

def overlay_heatmap(original_img, heatmap):
    heatmap = cv2.resize(heatmap, (original_img.shape[1], original_img.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    return cv2.addWeighted(original_img, 0.6, heatmap, 0.4, 0)

# ---------------- IMAGE UPLOAD ----------------
uploaded_file = st.file_uploader(
    "📤 Upload Image",
    type=["jpg", "jpeg", "png"]
)

show_heatmap = st.checkbox("🔥 Show model attention heatmap")

# ---------------- PREDICTION ----------------
if uploaded_file:
    image = Image.open(uploaded_file).convert("RGB")
    col_img, col_res = st.columns([1, 1.2])

    with col_img:
        st.image(image, caption="Uploaded Image", use_column_width=True)

    with col_res:
        with st.spinner("🧠 Analyzing image..."):
            time.sleep(1)

            img = image.resize(IMG_SIZE)
            img_array = np.array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)

            preds = model.predict(img_array)[0]
            pred_index = np.argmax(preds)

            ai_prob = round(float(preds[list(labels.keys())[list(labels.values()).index("ai")]]) * 100, 2)
            real_prob = round(100 - ai_prob, 2)

            severity_label, severity_color = get_severity(ai_prob)

            if ai_prob > real_prob:
                verdict = "AI Generated"
                color_class = "result-ai"
            else:
                verdict = "Real Photograph"
                color_class = "result-real"

            if show_heatmap:
                heatmap = generate_gradcam(img_array, model, pred_index)
                overlay = overlay_heatmap(np.array(image), heatmap)
                st.markdown("### 🔍 Model Attention (Grad-CAM)")
                st.image(overlay, use_column_width=True)

        st.markdown("<div class='box'>", unsafe_allow_html=True)

        st.markdown(f"""
        <div class="section-header">
            <img src="data:image/png;base64,{ICON_AI}">
            <h2>Result</h2>
        </div>
        """, unsafe_allow_html=True)

        st.markdown(f"<h3 class='{color_class}'>{verdict}</h3>", unsafe_allow_html=True)

        st.markdown(
            f"<p style='color:{severity_color}; font-weight:600;'>"
            f"AI Manipulation Severity: {severity_label}</p>",
            unsafe_allow_html=True
        )

        st.progress(ai_prob / 100)

        st.markdown(f"""
        - 🟥 **AI Probability:** `{ai_prob}%`
        - 🟩 **Real Probability:** `{real_prob}%`
        """)

        st.markdown("</div>", unsafe_allow_html=True)

# ---------------- DISCLAIMER ----------------
st.markdown("<div class='box'>", unsafe_allow_html=True)
st.markdown(f"""
<div class="section-header">
    <img src="data:image/png;base64,{ICON_WARN}">
    <h2>Disclaimer</h2>
</div>
""", unsafe_allow_html=True)

st.markdown("""
<p class="small-text">
This tool uses deep learning and explainable AI techniques.
Predictions may not be 100% accurate and are intended for
research and educational purposes only.
</p>
""", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)
