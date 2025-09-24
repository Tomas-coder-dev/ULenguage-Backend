const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number,
  features: [String],
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
