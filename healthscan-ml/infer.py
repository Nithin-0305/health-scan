import warnings
warnings.filterwarnings("ignore")

import argparse
import json
import torch
import cv2
import numpy as np
from torchvision.models import resnet18, ResNet18_Weights
from torchvision import transforms
from torch.nn import functional as F

# -----------------------
# Args
# -----------------------
parser = argparse.ArgumentParser()
parser.add_argument("--image", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()

# -----------------------
# Load Model (Inference Only)
# -----------------------
model = resnet18(weights=ResNet18_Weights.DEFAULT)
model.eval()

# -----------------------
# Preprocess
# -----------------------
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

image = cv2.imread(args.image)

if image is None:
    print(json.dumps({
        "label": "Invalid Image",
        "confidence": 0.0
    }))
    exit(0)

orig = image.copy()
input_tensor = transform(image).unsqueeze(0)

# -----------------------
# Forward pass only (NO backward)
# -----------------------
with torch.no_grad():
    output = model(input_tensor)
    prob = F.softmax(output, dim=1)
    confidence, pred = torch.max(prob, 1)

# -----------------------
# Simple Visual Highlight (Fake Heatmap)
# -----------------------
gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)
overlay = cv2.addWeighted(orig, 0.6, heatmap, 0.4, 0)

cv2.imwrite(args.output, overlay)

# -----------------------
# Output JSON
# -----------------------
result = {
    "label": f"Class_{pred.item()}",
    "confidence": round(confidence.item(), 3)
}

print(json.dumps(result))
