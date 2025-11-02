const mongoose = require('mongoose');

// Schema
const quechuaCusquenoSchema = new mongoose.Schema({
  spanish: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  quechua_cusqueno: {
    type: String,
    required: true,
    trim: true
  },
  context: { type: String, default: '' },
  category: { type: String, default: '' },
  examples: { type: [String], default: [] }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id; delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Hooks: normalización en save y en operaciones de update
quechuaCusquenoSchema.pre('save', function(next) {
  if (this.spanish) this.spanish = String(this.spanish).trim().toLowerCase();
  if (this.quechua_cusqueno) this.quechua_cusqueno = String(this.quechua_cusqueno).trim();
  next();
});

quechuaCusquenoSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  if (update.spanish) update.spanish = String(update.spanish).trim().toLowerCase();
  if (update.$set && update.$set.spanish) update.$set.spanish = String(update.$set.spanish).trim().toLowerCase();

  if (update.quechua_cusqueno) update.quechua_cusqueno = String(update.quechua_cusqueno).trim();
  if (update.$set && update.$set.quechua_cusqueno) update.$set.quechua_cusqueno = String(update.$set.quetchua).trim();

  if (update.$set) update.$set.updatedAt = new Date();
  else update.$set = { updatedAt: new Date() };

  this.setUpdate(update);
  next();
});

// Index (único, definido una sola vez)
quechuaCusquenoSchema.index({ spanish: 1 }, { unique: true, background: true });

quechuaCusquenoSchema.statics.normalizeAll = async function(options = {}) {
  const Model = this;
  const dry = !!options.dry;
  const batchSize = options.batchSize || 1000;

  const cursor = Model.find().cursor();
  const ops = [];
  let total = 0;
  let toUpdate = 0;
  let sample = null;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    total++;

    const spanishNorm = (doc.spanish || '').toString().trim().toLowerCase();
    const quechuaNorm = (doc.quechua_cusqueno || '').toString().trim();
    const examplesNorm = Array.isArray(doc.examples) ? doc.examples : (doc.examples ? [String(doc.examples)] : []);

    const update = {};
    if (doc.spanish !== spanishNorm) update.spanish = spanishNorm;
    if (doc.quechua_cusqueno !== quechuaNorm && quechuaNorm) update.quechua_cusqueno = quechuaNorm;

    const examplesAreDifferent = !Array.isArray(doc.examples) || (Array.isArray(doc.examples) && doc.examples.length === 0 && examplesNorm.length > 0);
    if (examplesAreDifferent) update.examples = examplesNorm;

    if (Object.keys(update).length > 0) {
      toUpdate++;
      if (!sample) sample = {
        id: doc._id.toString(),
        before: { spanish: doc.spanish, quechua_cusqueno: doc.quechua_cusqueno, examples: doc.examples },
        updates: update
      };
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: update, $currentDate: { updatedAt: true } },
          upsert: false
        }
      });
    }

    if (ops.length >= batchSize) {
      if (!dry) await Model.bulkWrite(ops, { ordered: false });
      ops.length = 0;
    }
  }

  if (ops.length > 0) {
    if (!dry) await Model.bulkWrite(ops, { ordered: false });
  }

  if (!dry) {
    try { await Model.syncIndexes(); } catch (e) { console.warn('syncIndexes warning:', e.message || e); }
  }

  return { total, toUpdate, sample };
};

const Quechua = mongoose.model('QuechuaCusqueno', quechuaCusquenoSchema);
module.exports = Quechua;