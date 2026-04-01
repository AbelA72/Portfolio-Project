const mongoose = require("mongoose");

const ChunkSchema = new mongoose.Schema({
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  startChar: { type: Number, required: true },
  endChar: { type: Number, required: true },
});

const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  text: { type: String },
  chunks: [ChunkSchema],
  processingStatus: { type: String, default: "pending" },
  processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", DocumentSchema);
