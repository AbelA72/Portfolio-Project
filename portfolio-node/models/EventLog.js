const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  eventType: { type: String },
  elementName: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventLog', eventLogSchema);
