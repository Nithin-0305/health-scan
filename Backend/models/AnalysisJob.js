
import mongoose from 'mongoose';

const analysisJobSchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  type: { type: String, enum: ['ocr','image','nlp','medcheck','full'], default: 'full' },
  status: { type: String, enum: ['queued','running','done','failed'], default: 'queued' },
  progress: { type: Number, default: 0 }, 
  result: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  finishedAt: Date
});

const AnalysisJob = mongoose.model('AnalysisJob', analysisJobSchema);
export default AnalysisJob;
