// workers/processor.js
import fs from "fs/promises";
import path from "path";
import Tesseract from "tesseract.js";
import jobQueue from "../services/jobQueue.js";
import AnalysisJob from "../models/AnalysisJob.js";
import Report from "../models/Report.js";
import { runVisionAnalysis } from "./visionWorker.js";
import { generatePatientExplanation } from "../services/nlpService.js";
import { runBrainSegmentation } from "../services/brainModelService.js";
import { convert } from "pdf-poppler";

// NEW: PDF text extraction library
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

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

    const ext = path.extname(report.storedFilename).toLowerCase();

    let extractedText = "";

    // =============================
    // STEP 1: OCR / PDF TEXT EXTRACTION
    // =============================
    job.progress = 30;
    await job.save();

    if (ext === ".pdf") {

      console.log("📄 PDF detected");

      const data = new Uint8Array(await fs.readFile(filePath));
      const pdf = await pdfjs.getDocument({ data }).promise;

      let textContent = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        textContent += strings.join(" ") + "\n";
      }

      extractedText = textContent;

      // Convert PDF pages → images
      const outputDir = path.join(process.cwd(), "uploads", "pdf-images");

      const options = {
        format: "png",
        out_dir: outputDir,
        out_prefix: report._id.toString(),
        page: null,
      };

      await convert(filePath, options);

      console.log("📄 PDF pages converted to images");

    } else {

      // NORMAL IMAGE OCR
      try {
        const ocrResult = await Tesseract.recognize(filePath, "eng", {
          logger: (m) => console.log(m.status),
        });

        extractedText = ocrResult.data.text || "";

      } catch (ocrErr) {
        console.error("OCR error:", ocrErr);
        extractedText = "";
      }

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

    report.extractedText = extractedText;
    report.fullReportText = extractedText;
    report.ocrSections = sections;
    await report.save();

    job.progress = 70;
    await job.save();

    // =============================
    // STEP 3: VISION ANALYSIS
    // =============================
    if (ext === ".pdf") {

      const pdfImagesDir = path.join(process.cwd(), "uploads", "pdf-images");

      const files = await fs.readdir(pdfImagesDir);

      for (const file of files) {

        if (!file.startsWith(report._id.toString())) continue;

        const imagePath = path.join(pdfImagesDir, file);

        await runVisionAnalysis(report._id, imagePath);

      }

    } else if (report.type === "image") {

      await runVisionAnalysis(report._id, filePath);

      const updatedReport = await Report.findById(report._id);

      if (
        updatedReport.visionAnalysis?.observation
          ?.toLowerCase()
          .includes("brain")
      ) {
        await runBrainSegmentation(report._id, filePath);
      }

    }

    job.progress = 85;
    await job.save();

    const updatedReport = await Report.findById(report._id);

    // =============================
    // STEP 4: NLP EXPLANATION
    // =============================
    const explanation = await generatePatientExplanation(updatedReport);

    if (explanation) {
      updatedReport.aiExplanation = { summaryForPatient: explanation };
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