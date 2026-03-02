import fs from "fs";
import path from "path";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Report from "../models/Report.js";

const REGION_MAP = {
  "upper-left": { x: 0.25, y: 0.25 },
  "upper-right": { x: 0.75, y: 0.25 },
  "center": { x: 0.5, y: 0.5 },
  "lower-left": { x: 0.25, y: 0.75 },
  "lower-right": { x: 0.75, y: 0.75 },
  "diffuse": { x: 0.5, y: 0.5 }
};

export async function runVisionAnalysis(reportId, filePath) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("GEMINI KEY LOADED:", process.env.GEMINI_API_KEY);
console.log("KEY LENGTH:", process.env.GEMINI_API_KEY?.length);
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const imageBuffer = fs.readFileSync(filePath);

    const prompt = `
You are a medical imaging AI.

Analyze the medical image and return STRICT JSON only.

Return in this exact format:

{
  "observation": "...",
  "possibleInterpretation": "...",
  "severity": "low | moderate | high",
  "suspectedRegion": "upper-left | upper-right | center | lower-left | lower-right | diffuse | no-clear-region",
  "boundingBox": {
    "x": number between 0 and 1,
    "y": number between 0 and 1,
    "width": number between 0 and 1,
    "height": number between 0 and 1
  }
}

Rules:
- boundingBox must be relative to image size (percentage, 0 to 1)
- x and y represent top-left corner of abnormal region
- width and height represent abnormal region size
- If no clear abnormality, set suspectedRegion to "no-clear-region" and boundingBox to null
- Do not return anything outside JSON
`;

const result = await model.generateContent([
  prompt,
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBuffer.toString("base64")
    }
  }
]);

let text = result.response.text().trim();

// Remove markdown code blocks if present
if (text.startsWith("```")) {
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

    const parsed = JSON.parse(text);

// Safety
if (!parsed.boundingBox) {
  parsed.boundingBox = null;
}

let highlightedPath = null;

const image = sharp(filePath);
const metadata = await image.metadata();

const imageWidth = metadata.width;
const imageHeight = metadata.height;

let centerX = null;
let centerY = null;
let radius = null;

// ===================================
// 1️⃣ PRIORITY: Use boundingBox
// ===================================
if (
  parsed.boundingBox &&
  typeof parsed.boundingBox.x === "number" &&
  typeof parsed.boundingBox.y === "number" &&
  typeof parsed.boundingBox.width === "number" &&
  typeof parsed.boundingBox.height === "number"
) {
  const { x, y, width, height } = parsed.boundingBox;

  const boxX = x * imageWidth;
  const boxY = y * imageHeight;
  const boxW = width * imageWidth;
  const boxH = height * imageHeight;

  centerX = boxX + boxW / 2;
  centerY = boxY + boxH / 2;

  // Smaller precise circle
  radius = Math.min(boxW, boxH) / 2;
}

// ===================================
// 2️⃣ FALLBACK: Use REGION_MAP
// ===================================
else if (
  parsed.suspectedRegion &&
  parsed.suspectedRegion !== "no-clear-region" &&
  REGION_MAP[parsed.suspectedRegion]
) {
  centerX = imageWidth * REGION_MAP[parsed.suspectedRegion].x;
  centerY = imageHeight * REGION_MAP[parsed.suspectedRegion].y;

  radius = Math.min(imageWidth, imageHeight) * 0.12;
}

// ===================================
// DRAW CIRCLE IF WE HAVE LOCATION
// ===================================
if (centerX && centerY && radius) {

  const svgCircle = `
    <svg width="${imageWidth}" height="${imageHeight}">
      <circle 
        cx="${centerX}" 
        cy="${centerY}" 
        r="${radius}" 
        fill="none" 
        stroke="red" 
        stroke-width="4"/>
    </svg>
  `;

  const outputDir = path.join(process.cwd(), "uploads", "highlighted");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  highlightedPath = path.join(
    "uploads",
    "highlighted",
    `${reportId}_highlighted.jpg`
  );

  await image
    .composite([{ input: Buffer.from(svgCircle), top: 0, left: 0 }])
    .toFile(path.join(process.cwd(), highlightedPath));
}

await Report.findByIdAndUpdate(reportId, {
  visionAnalysis: parsed,
  highlightedImage: highlightedPath
});
    console.log("Vision analysis completed:", reportId);

  } catch (err) {
    console.error("Vision analysis failed:", err.message);
  }
}
