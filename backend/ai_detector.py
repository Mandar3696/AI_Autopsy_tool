import cv2
import numpy as np
from PIL import Image

def analyze_image(image):
    # Convert PIL image to OpenCV
    img = np.array(image)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Blur detection
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

    # Noise estimation
    noise = np.std(gray)

    # Simple heuristic decision
    if laplacian_var < 80 and noise < 20:
        return "🤖 AI Generated", laplacian_var, noise
    else:
        return "📷 Real Image", laplacian_var, noise
