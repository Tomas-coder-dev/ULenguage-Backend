const mongoose = require('mongoose');

const quechuaCusquenoSchema = new mongoose.Schema({
  spanish: { type: String, required: true, index: true, unique: true },
  quechua_cusqueno: { type: String, required: true },
  context: { type: String },
  category: { type: String },
  examples: [String]
});

quechuaCusquenoSchema.pre('save', function(next) {
  this.spanish = this.spanish.trim().toLowerCase();
  next();
});

module.exports = mongoose.model('QuechuaCusqueno', quechuaCusquenoSchema);