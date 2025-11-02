'use strict';
/**
 * src/models/QuechuaCusqueno.js
 *
 * Modelo corregido con protección contra doble registro:
 * - unique:true en el campo spanish (no schema.index duplicado)
 * - evita volver a registrar el modelo si ya existe en mongoose.models
 * - hooks de normalización corregidos
 */

const mongoose = require('mongoose');

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
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Hooks: normalización en save
quechuaCusquenoSchema.pre('save', function(next) {
  if (this.spanish) this.spanish = String(this.spanish).trim().toLowerCase();
  if (this.quechua_cusqueno) this.quechua_cusqueno = String(this.quechua_cusqueno).trim();
  next();
});

// Hooks: normalización en operaciones de update (maneja $set y update directo)
quechuaCusquenoSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  // Normalize direct top-level fields
  if (typeof update.spanish !== 'undefined') {
    update.spanish = String(update.spanish).trim().toLowerCase();
  }
  if (typeof update.quechua_cusqueno !== 'undefined') {
    update.quechua_cusqueno = String(update.quechua_cusqueno).trim();
  }

  // Normalize fields under $set
  if (update.$set) {
    if (typeof update.$set.spanish !== 'undefined') {
      update.$set.spanish = String(update.$set.spanish).trim().toLowerCase();
    }
    if (typeof update.$set.quechua_cusqueno !== 'undefined') {
      update.$set.quechua_cusqueno = String(update.$set.quechua_cusqueno).trim();
    }
    update.$set.updatedAt = new Date();
  } else {
    update.$set = { updatedAt: new Date() };
  }

  this.setUpdate(update);
  next();
});

// No volvemos a definir schema.index({ spanish: 1 }) aquí — usamos unique:true en el campo.

// Export: evita registrar el modelo dos veces en el mismo proceso
const MODEL_NAME = 'QuechuaCusqueno';
module.exports = mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, quechuaCusquenoSchema);