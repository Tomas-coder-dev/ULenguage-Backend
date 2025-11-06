'use strict';
/**
 * src/models/CommonPhrase.js
 * 
 * Modelo para frases comunes/útiles multi-idioma (es/en/qu)
 * Usadas en la pantalla de traducción para acceso rápido
 */

const mongoose = require('mongoose');

const commonPhraseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
    // Ejemplos: 'saludos', 'navegacion', 'compras', 'emergencias', 'turismo'
  },
  icon: {
    type: String,
    default: 'chat' // Nombre del ícono (CupertinoIcons o similar)
  },
  color: {
    type: String,
    default: '#DA2C38' // Color hex para UI
  },
  order: {
    type: Number,
    default: 0 // Para ordenar categorías
  },
  phrases: [{
    spanish: { type: String, required: true, trim: true },
    english: { type: String, required: true, trim: true },
    quechua: { type: String, required: true, trim: true },
    pronunciation: { type: String, default: '' }, // Fonética del quechua
    audioUrl: { type: String, default: '' }, // URL de audio (futuro)
    usage: { type: Number, default: 0 }, // Contador de uso
    isActive: { type: Boolean, default: true }
  }],
  isActive: {
    type: Boolean,
    default: true
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
  }
});

// Índices
commonPhraseSchema.index({ category: 1, order: 1 });
commonPhraseSchema.index({ isActive: 1 });
commonPhraseSchema.index({ 'phrases.usage': -1 }); // Para ordenar por popularidad

// Método estático: obtener frases activas ordenadas
commonPhraseSchema.statics.getActivePhrasesGrouped = async function() {
  return this.find({ isActive: true })
    .sort({ order: 1, category: 1 })
    .lean();
};

// Método estático: incrementar uso de una frase
commonPhraseSchema.statics.incrementPhraseUsage = async function(categoryId, phraseIndex) {
  return this.findByIdAndUpdate(
    categoryId,
    { $inc: { [`phrases.${phraseIndex}.usage`]: 1 } },
    { new: true }
  );
};

const MODEL_NAME = 'CommonPhrase';
module.exports = mongoose.models[MODEL_NAME] || mongoose.model(MODEL_NAME, commonPhraseSchema);
