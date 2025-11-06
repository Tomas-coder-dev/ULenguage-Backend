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
    unique: false, // Cambiado: permite múltiples sentidos/variantes de la misma palabra
    trim: true,
    lowercase: true
  },
  quechua_cusqueno: {
    type: String,
    required: true,
    trim: true
  },
  variants: {
    type: [String],
    default: [], // Ortografías alternativas, errores comunes, formas sin tilde
    trim: true
  },
  phonetics: {
    type: String,
    default: '' // Representación fonética (opcional) para matching fonético
  },
  sense: {
    type: String,
    default: '' // Diferencia sentidos: "casa (edificio)" vs "casa (familia)"
  },
  context: { type: String, default: '' },
  category: { type: String, default: '' },
  examples: { type: [String], default: [] },
  source: {
    type: String,
    enum: ['seeder', 'scraper', 'user', 'manual', 'glosbe'],
    default: 'seeder' // Trazabilidad: origen de la entrada
  },
  frequency: {
    type: Number,
    default: 0, // Frecuencia de uso: incrementa con traducciones/confirmaciones
    min: 0
  }
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

// Utilidad: normalización robusta (elimina puntuación, normaliza Unicode, etc.)
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFC') // Normaliza Unicode (combina caracteres acentuados)
    .toLowerCase()
    .trim()
    .replace(/[^\w\sáéíóúñü]/gi, '') // Elimina puntuación excepto letras, números, espacios y acentos comunes
    .replace(/\s+/g, ' '); // Normaliza espacios múltiples a uno solo
}

// Hooks: normalización en save
quechuaCusquenoSchema.pre('save', function(next) {
  if (this.spanish) this.spanish = normalizeText(this.spanish);
  if (this.quechua_cusqueno) this.quechua_cusqueno = String(this.quechua_cusqueno).trim();
  
  // Normaliza variantes
  if (this.variants && Array.isArray(this.variants)) {
    this.variants = this.variants.map(v => normalizeText(v)).filter(v => v.length > 0);
  }
  
  next();
});

// Hooks: normalización en operaciones de update (maneja $set y update directo)
quechuaCusquenoSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  // Normalize direct top-level fields
  if (typeof update.spanish !== 'undefined') {
    update.spanish = normalizeText(update.spanish);
  }
  if (typeof update.quechua_cusqueno !== 'undefined') {
    update.quechua_cusqueno = String(update.quechua_cusqueno).trim();
  }
  if (update.variants && Array.isArray(update.variants)) {
    update.variants = update.variants.map(v => normalizeText(v)).filter(v => v.length > 0);
  }

  // Normalize fields under $set
  if (update.$set) {
    if (typeof update.$set.spanish !== 'undefined') {
      update.$set.spanish = normalizeText(update.$set.spanish);
    }
    if (typeof update.$set.quechua_cusqueno !== 'undefined') {
      update.$set.quechua_cusqueno = String(update.$set.quechua_cusqueno).trim();
    }
    if (update.$set.variants && Array.isArray(update.$set.variants)) {
      update.$set.variants = update.$set.variants.map(v => normalizeText(v)).filter(v => v.length > 0);
    }
    update.$set.updatedAt = new Date();
  } else {
    update.$set = { updatedAt: new Date() };
  }

  this.setUpdate(update);
  next();
});

// Índices para mejorar búsquedas
// Índice compuesto para búsquedas exactas y ordenar por frecuencia
quechuaCusquenoSchema.index({ spanish: 1, frequency: -1 });

// Índice de texto para búsquedas fuzzy/por frase en español y quechua
quechuaCusquenoSchema.index({ 
  spanish: 'text', 
  quechua_cusqueno: 'text', 
  variants: 'text' 
}, {
  weights: {
    spanish: 10,        // Mayor peso a coincidencias en español
    variants: 8,        // Peso medio a variantes
    quechua_cusqueno: 5 // Menor peso a coincidencias en quechua
  },
  name: 'text_search_index'
});

// Índice para ordenar por frecuencia
quechuaCusquenoSchema.index({ frequency: -1 });

// Índice para filtrar por source
quechuaCusquenoSchema.index({ source: 1 });

// Export: evita registrar el modelo dos veces en el mismo proceso
const MODEL_NAME = 'QuechuaCusqueno';
module.exports = mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, quechuaCusquenoSchema);