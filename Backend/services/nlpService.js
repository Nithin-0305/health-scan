// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// console.log("NLP GEMINI KEY:", process.env.GEMINI_API_KEY);
// export async function generatePatientExplanation(report) {

//   try {
//     const model = genAI.getGenerativeModel({
//       model: "gemini-2.5-flash"
//     });

//     const prompt = `
// You are a medical AI assistant.

// Based on the following structured medical analysis, generate a patient-friendly explanation.

// VISION ANALYSIS:
// Observation: ${report.visionAnalysis?.observation || "Not available"}
// Possible Interpretation: ${report.visionAnalysis?.possibleInterpretation || "Not available"}
// Severity: ${report.visionAnalysis?.severity || "Unknown"}

// OCR SECTIONS:
// Diagnosis: ${report.ocrSections?.diagnosis || "Not available"}
// Findings: ${report.ocrSections?.findings || "Not available"}
// Impression: ${report.ocrSections?.impression || "Not available"}

// Return STRICT JSON in this format:

// {
//   "summaryForPatient": "...",
//   "riskLevel": "Low | Moderate | High",
//   "recommendedAction": "...",
//   "disclaimer": "This AI system is not a medical diagnosis. Please consult a qualified doctor."
// }

// Make explanation simple and easy to understand.
// Do not include extra text outside JSON.
// `;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();

//     const cleaned = text.replace(/```json|```/g, "").trim();
//     const parsed = JSON.parse(cleaned);

//     return parsed;

//   } catch (error) {
//     console.error("NLP Generation Error:", error);
//     return null;
//   }
// }

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generatePatientExplanation(report) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing in NLP service");
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // =========================
    // Include Brain Model Result (EXISTING)
    // =========================
    let brainSection = "";

    if (report.brainModelResult?.status) {
      brainSection = `
BRAIN SEGMENTATION MODEL RESULT:
Status: ${report.brainModelResult.status}
`;
    }

    // =========================
    // NEW: FULL REPORT TEXT (FOR PDF SUPPORT)
    // =========================
    let fullReportSection = "";

    if (report.fullReportText) {
      fullReportSection = `
FULL REPORT TEXT:
${report.fullReportText.slice(0, 3000)}
`;
    }

    // =========================
// DATA VALIDATION (NEW)
// =========================
const hasOCR =
  report.extractedText && report.extractedText.trim().length > 20;

const hasVision =
  report.visionAnalysis && report.visionAnalysis.observation;

const hasBrainModel =
  report.brainModelResult && report.brainModelResult.status;

if (!hasOCR && !hasVision && !hasBrainModel) {
  return {
    summaryForPatient:
      "The uploaded report could not be clearly analyzed. The document may be unclear, empty, or unsupported.",
    riskLevel: "Unknown",
    recommendedAction:
      "Please upload a clearer medical report or consult a healthcare professional.",
    disclaimer:
      "This AI system is not a medical diagnosis. Please consult a qualified doctor.",
  };
}

    const prompt = `
You are a medical AI assistant helping patients understand their medical reports.

${fullReportSection}

Report Context:
Observation: ${report.visionAnalysis?.observation || "Not available"}
Interpretation: ${report.visionAnalysis?.possibleInterpretation || "Not available"}
Severity: ${report.visionAnalysis?.severity || "Unknown"}

Diagnosis: ${report.ocrSections?.diagnosis || "Not available"}
Findings: ${report.ocrSections?.findings || "Not available"}
Impression: ${report.ocrSections?.impression || "Not available"}

Brain Model Result: ${report.brainModelResult?.status || "Not available"}

Important rules:
- Explain the report in simple patient-friendly language.
- Keep the summary short (maximum 4-5 sentences, if needed then you can give large summary if not covered in 3-4 sentences).
- Be calm and clear.
- Mention possible concerns if severity is high.
- Suggest consulting a doctor for confirmation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;

  } catch (error) {
    console.error("NLP Generation Error:", error);
    return null;
  }
}