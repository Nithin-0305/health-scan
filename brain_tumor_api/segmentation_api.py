import io
import base64
import torch
import torch.nn as nn
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def double_conv(in_ch, out_ch):
    return nn.Sequential(
        nn.Conv2d(in_ch, out_ch, 3, padding=1),
        nn.ReLU(inplace=True),
        nn.Conv2d(out_ch, out_ch, 3, padding=1),
        nn.ReLU(inplace=True),
    )

class UNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.pool = nn.MaxPool2d(2)
        self.enc1 = double_conv(3, 32)
        self.enc2 = double_conv(32, 64)
        self.bottleneck = double_conv(64, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = double_conv(128, 64)
        self.up2 = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.dec2 = double_conv(64, 32)
        self.out = nn.Conv2d(32, 1, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        b = self.bottleneck(self.pool(e2))
        d1 = self.up1(b)
        d1 = torch.cat([d1, e2], dim=1)
        d1 = self.dec1(d1)
        d2 = self.up2(d1)
        d2 = torch.cat([d2, e1], dim=1)
        d2 = self.dec2(d2)
        return torch.sigmoid(self.out(d2))


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = UNet().to(device)
model.load_state_dict(torch.load("brain_tumor_segmentation.pth", map_location=device))
model.eval()

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
])


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    original = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    h, w, _ = original.shape

    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(input_tensor)

    pred_mask = output.squeeze().cpu().numpy()
    pred_mask = cv2.resize(pred_mask, (w, h))

    pred_mask = (pred_mask > 0.7).astype(np.uint8) * 255

    contours, _ = cv2.findContours(pred_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    clean_mask = np.zeros_like(pred_mask)

    if len(contours) > 0:
        largest = max(contours, key=cv2.contourArea)
        cv2.drawContours(clean_mask, [largest], -1, 255, -1)

    # Decision
    tumor_pixels = np.sum(clean_mask > 0)
    total_pixels = clean_mask.shape[0] * clean_mask.shape[1]
    tumor_ratio = tumor_pixels / total_pixels

    output_image = original.copy()

    if tumor_ratio > 0.01:
        status = "Tumor Detected"
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(output_image, contours, -1, (0, 255, 0), 3)
    else:
        status = "No Tumor Detected"

    cv2.putText(output_image,
                status,
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255) if status == "Tumor Detected" else (0, 255, 0),
                3)

   
    _, buffer = cv2.imencode(".jpg", output_image)
    img_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "status": status,
        "image": img_base64
    }