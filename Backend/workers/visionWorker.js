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
You are an AI performing visual analysis of a medical image.

Describe any visible abnormalities.

Rules:
- Use cautious language like "may indicate".
- Do NOT give definitive diagnosis.
- Return only valid JSON.
- Choose suspectedRegion from:
  upper-left, upper-right, center,
  lower-left, lower-right, diffuse, no-clear-region
- severity must be: low, moderate, or high.

Return JSON:
{
  "observation": "...",
  "possibleInterpretation": "...",
  "severity": "...",
  "suspectedRegion": "..."
}
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

    // Remove markdown code block if present
    if (text.startsWith("```")) {
    text = text.replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
    }

const parsed = JSON.parse(text);


    let highlightedPath = null;

    if (
      parsed.suspectedRegion &&
      parsed.suspectedRegion !== "no-clear-region" &&
      REGION_MAP[parsed.suspectedRegion]
    ) {
      const image = sharp(filePath);
      const metadata = await image.metadata();

      const centerX = Math.floor(metadata.width * REGION_MAP[parsed.suspectedRegion].x);
      const centerY = Math.floor(metadata.height * REGION_MAP[parsed.suspectedRegion].y);
      const radius = Math.floor(Math.min(metadata.width, metadata.height) * 0.15);

      const svgCircle = `
        <svg width="${metadata.width}" height="${metadata.height}">
          <circle cx="${centerX}" cy="${centerY}" r="${radius}"
            fill="none" stroke="red" stroke-width="5"/>
        </svg>
      `;

      const outputDir = path.join(process.cwd(), "uploads", "highlighted");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
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
