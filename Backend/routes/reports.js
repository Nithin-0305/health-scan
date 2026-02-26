import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Report from '../models/Report.js';
import AnalysisJob from '../models/AnalysisJob.js';
import authMiddleware from '../middleware/auth.js';
import jobQueue from '../services/jobQueue.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + ext);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });


// ============================
// Upload Route
// ============================
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const mime = req.file.mimetype || '';
    let type = 'other';
    if (mime.includes('pdf')) type = 'pdf';
    else if (mime.startsWith('image')) type = 'image';
    else if (mime.startsWith('text')) type = 'text';

    const report = new Report({
      owner: userId,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      mimeType: mime,
      size: req.file.size,
      type,
      status: 'uploaded'
    });
    await report.save();

    const job = new AnalysisJob({
      report: report._id,
      type: 'full',
      status: 'queued',
      progress: 0
    });
    await job.save();

    report.analysisJob = job._id;
    await report.save();

    jobQueue.enqueue(job._id.toString());

    res.json({ ok: true, reportId: report._id, jobId: job._id });

  } catch (err) {
    console.error('upload error', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});


// ============================
// Status Route
// ============================
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const rep = await Report.findById(req.params.id).select('-__v');
    if (!rep) return res.status(404).json({ error: 'Report not found' });
    res.json({ status: rep.status, analysisJob: rep.analysisJob });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================
// Get All Reports (History)
// ============================
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      const reports = await Report.find({ owner: userId })
        .select('-__v')
        .sort({ uploadedAt: -1 });

      res.json({ reports });

    } catch (err) {
      console.error("History fetch error:", err);
      res.status(500).json({ error: 'Server error' });
    }
  });


// ============================
// Get Report Route
// ============================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const rep = await Report.findById(req.params.id).select('-__v');
    if (!rep) return res.status(404).json({ error: 'Report not found' });
    res.json({ report: rep });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// ============================
// Chat Route (NEW)
// ============================
router.post('/:id/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const reportId = req.params.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Save user message
    report.chat.push({
      role: "user",
      message
    });

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are a medical AI assistant.

Report Context:

Observation:
${report.visionAnalysis?.observation || "N/A"}

Interpretation:
${report.visionAnalysis?.possibleInterpretation || "N/A"}

Severity:
${report.visionAnalysis?.severity || "Unknown"}

Patient Summary:
${report.aiExplanation?.summaryForPatient || "N/A"}

User Question:
${message}

Answer clearly and simply for a patient.
Keep it short and helpful.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Save AI reply
    report.chat.push({
      role: "assistant",
      message: text
    });

    await report.save();

    res.json({ reply: text });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

export default router;