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
    // Include Brain Model Result (NEW)
    // =========================
    let brainSection = "";

    if (report.brainModelResult?.status) {
      brainSection = `
BRAIN SEGMENTATION MODEL RESULT:
Status: ${report.brainModelResult.status}
`;
    }

    const prompt = `
You are a medical AI assistant.

Based on the following structured medical analysis, generate a patient-friendly explanation.

VISION ANALYSIS:
Observation: ${report.visionAnalysis?.observation || "Not available"}
Possible Interpretation: ${report.visionAnalysis?.possibleInterpretation || "Not available"}
Severity: ${report.visionAnalysis?.severity || "Unknown"}

OCR SECTIONS:
Diagnosis: ${report.ocrSections?.diagnosis || "Not available"}
Findings: ${report.ocrSections?.findings || "Not available"}
Impression: ${report.ocrSections?.impression || "Not available"}

${brainSection}

Important rules:
- If Brain Segmentation status says "Tumor Detected", riskLevel MUST be High.
- If no tumor detected and severity is low, riskLevel should be Low.
- Be clear, calm, and patient-friendly.
- Do not sound alarming unless necessary.

Return STRICT JSON in this format:

{
  "summaryForPatient": "...",
  "riskLevel": "Low | Moderate | High",
  "recommendedAction": "...",
  "disclaimer": "This AI system is not a medical diagnosis. Please consult a qualified doctor."
}

Do not include anything outside JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Remove markdown formatting if Gemini adds it
    const cleaned = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleaned);

    return parsed;

  } catch (error) {
    console.error("NLP Generation Error:", error);
    return null;
  }
}