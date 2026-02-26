import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  originalFilename: { type: String },
  storedFilename: { type: String },
  mimeType: { type: String },
  size: { type: Number },

  type: { 
    type: String, 
    enum: ['pdf','image','text','other'], 
    default: 'other' 
  },

  status: { 
    type: String, 
    enum: ['uploaded','processing','completed','failed'], 
    default: 'uploaded' 
  },

  uploadedAt: { type: Date, default: Date.now },

  // -----------------------
  // OCR (Week 3)
  // -----------------------
  extractedText: { type: String },

  ocrSections: {
    diagnosis: String,
    impression: String,
    findings: String,
  },

  // -----------------------
  // Vision Analysis (Week 4)
  // -----------------------
  visionAnalysis: {
    observation: String,
    possibleInterpretation: String,
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high']
    },
    suspectedRegion: {
      type: String,
      enum: [
        'upper-left',
        'upper-right',
        'center',
        'lower-left',
        'lower-right',
        'diffuse',
        'no-clear-region'
      ]
    }
  },

  highlightedImage: { type: String },

  // -----------------------
  // AI Explanation (Week 5)
  // -----------------------
  aiExplanation: {
    summaryForPatient: String,
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High']
    },
    recommendedAction: String,
    disclaimer: String,
  },


    chat: [
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
],
  // -----------------------
  // Future Advanced NLP Layer
  // -----------------------
  nlp: {
    patientSummary: String,
    clinicianSummary: String,
    entities: {
      diseases: [String],
      medications: [
        {
          name: String,
          dose: String,
          route: String,
          frequency: String
        }
      ]
    }
  },

  medcheck: {
    duplicateDrugs: [String],
    highDoseWarnings: [String]
  },



  analysisJob: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AnalysisJob' 
  },

  

});

const Report = mongoose.model('Report', reportSchema);
export default Report;