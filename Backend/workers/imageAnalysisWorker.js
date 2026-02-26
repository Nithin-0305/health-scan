import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import Report from "../models/Report.js";


console.log("🔥 imageAnalysisWorker STARTED");
const PYTHON_PATH = "python"; // or python3
const ML_SCRIPT = path.join(
  process.cwd(),
  "..",
  "healthscan-ml",
  "infer.py"
);


export const runImageAnalysis = async (reportId, imagePath) => {
  try {
    const outputDir = path.join("uploads", "heatmaps");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const heatmapFile = `${reportId}_heatmap.png`;
    const heatmapPath = path.join(outputDir, heatmapFile);

    const pyProcess = spawn(PYTHON_PATH, [
      ML_SCRIPT,
      "--image",
      imagePath,
      "--output",
      heatmapPath
    ]);

    let resultData = "";

    pyProcess.stdout.on("data", (data) => {
      resultData += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      console.error("ML Error:", data.toString());
    });

    pyProcess.on("close", async () => {
      const parsed = JSON.parse(resultData);

      await Report.findByIdAndUpdate(reportId, {
        imageFindings: {
          label: parsed.label,
          confidence: parsed.confidence,
          heatmapPath: heatmapPath.replace(/\\/g, "/")
        }
      });
    });
  } catch (err) {
    console.error("Image analysis worker failed", err);
  }
};
