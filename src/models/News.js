const mongoose = require('mongoose');

/**
 * Esquema de Noticias Culturales
 * Soporta multiidioma: español, inglés, quechua
 */
const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título de la noticia es obligatorio'],
      trim: true,
      maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    content: {
      type: String,
      required: [true, 'El contenido de la noticia es obligatorio'],
      trim: true,
      maxlength: [2000, 'El contenido no puede exceder 2000 caracteres']
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [300, 'El resumen no puede exceder 300 caracteres'],
      default: ''
    },
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800'
    },
    language: {
      type: String,
      required: [true, 'El idioma es obligatorio'],
      enum: ['es', 'en', 'qu'],
      default: 'es'
    },
    category: {
      type: String,
      enum: ['cultura', 'festividad', 'arqueologia', 'tradicion', 'gastronomia', 'general'],
      default: 'general'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    author: {
      type: String,
      default: 'Equipo ULenguage',
      trim: true
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para optimizar búsquedas
newsSchema.index({ language: 1, isActive: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });

// Virtual para obtener resumen corto si no existe
newsSchema.virtual('shortSummary').get(function() {
  if (this.summary) return this.summary;
  return this.content.substring(0, 150) + '...';
});

// Método estático para obtener últimas noticias por idioma
newsSchema.statics.getLatestByLanguage = async function(language, limit = 3) {
  return this.find({
    language: language,
    isActive: true
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('-__v')
    .lean();
};

const News = mongoose.model('News', newsSchema);

module.exports = News;
