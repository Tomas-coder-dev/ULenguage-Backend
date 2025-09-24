const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  term: { type: String, required: true },
  translationEs: { type: String, required: true },
  translationEn: { type: String, required: true },
  context: String,
  pronunciation: String,
  category: String,
}, { timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);
