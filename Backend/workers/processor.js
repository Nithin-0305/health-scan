// workers/processor.js
import fs from "fs/promises";
import path from "path";
import Tesseract from "tesseract.js";
import jobQueue from "../services/jobQueue.js";
import AnalysisJob from "../models/AnalysisJob.js";
import Report from "../models/Report.js";
import { runVisionAnalysis } from "./visionWorker.js";
import { generatePatientExplanation } from "../services/nlpService.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

jobQueue.on("process", async (jobId) => {
  const job = await AnalysisJob.findById(jobId).populate("report");
  if (!job) return;

  const report = await Report.findById(job.report._id);

  try {
    // =============================
    // JOB START
    // =============================
    job.status = "running";
    job.progress = 10;
    job.startedAt = new Date();
    await job.save();

    report.status = "processing";
    await report.save();

    const filePath = path.join(
      process.cwd(),
      "uploads",
      report.storedFilename
    );

    // =============================
    // STEP 1: OCR (WEEK 3)
    // =============================
    job.progress = 30;
    await job.save();

    let extractedText = "";

    try {
      const ocrResult = await Tesseract.recognize(filePath, "eng", {
        logger: (m) => console.log(m.status),
      });

      extractedText = ocrResult.data.text || "";
    } catch (ocrErr) {
      console.error("OCR error:", ocrErr);
      extractedText = "";
    }

    // Normalize text
    extractedText = extractedText
      .replace(/\n{2,}/g, "\n")
      .replace(/\s{2,}/g, " ")
      .trim();

    // =============================
    // STEP 2: SECTION PARSING
    // =============================
    const sections = {
      diagnosis: extractedText.match(/diagnosis[:\-]\s*(.*)/i)?.[1] || "",
      impression: extractedText.match(/impression[:\-]\s*(.*)/i)?.[1] || "",
      findings: extractedText.match(/findings[:\-]\s*(.*)/i)?.[1] || "",
    };

    // Save OCR results before vision
    report.extractedText = extractedText;
    report.ocrSections = sections;
    await report.save();

    job.progress = 70;
    await job.save();

    // =============================
    // STEP 3: VISION ANALYSIS (WEEK 4)
    // =============================
    if (report.type === "image") {
      await runVisionAnalysis(report._id, filePath);
    }

    job.progress = 85;
    await job.save();

    // 🔥 VERY IMPORTANT:
    // Reload updated report AFTER vision analysis
    const updatedReport = await Report.findById(report._id);

    // =============================
    // STEP 4: NLP EXPLANATION (WEEK 5)
    // =============================
    const explanation = await generatePatientExplanation(updatedReport);

    if (explanation) {
      updatedReport.aiExplanation = explanation;
      await updatedReport.save();
    }

    // =============================
    // FINALIZE REPORT
    // =============================
    updatedReport.status = "completed";
    await updatedReport.save();

    job.status = "done";
    job.progress = 100;
    job.finishedAt = new Date();
    await job.save();

    console.log("✅ Processing completed for report:", updatedReport._id);

  } catch (err) {
    console.error("❌ Processing failed:", err);

    job.status = "failed";
    job.error = err.message;
    job.finishedAt = new Date();
    await job.save();

    report.status = "failed";
    await report.save();
  }
});