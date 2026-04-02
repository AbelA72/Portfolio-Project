const mongoose = require('mongoose');

const RetrievedDocumentSchema = new mongoose.Schema({
  docName: { type: String },
  chunkIndex: { type: Number },
  chunkText: { type: String },
  relevanceScore: { type: Number }
}, { _id: false });

const ConfidenceMetricsSchema = new mongoose.Schema({
  overallConfidence: { type: Number },
  retrievalConfidence: { type: Number },
  responseConfidence: { type: Number, default: null },
  retrievalMethod: { type: String }
}, { _id: false });

const interactionSchema = new mongoose.Schema({
  userInput: { type: String },
  botResponse: { type: String },
  retrievalMethod: { type: String },
  retrievedDocuments: { type: [RetrievedDocumentSchema], default: [] },
  confidenceMetrics: { type: ConfidenceMetricsSchema, default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', interactionSchema);
