const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  from_lang: { 
    type: String, 
    enum: ['quechua', 'spanish', 'english'],
    required: true 
  },
  to_lang: { 
    type: String, 
    enum: ['quechua', 'spanish', 'english'],
    required: true 
  },
  original_text: { 
    type: String, 
    required: true 
  },
  translated_text: { 
    type: String, 
    required: true 
  },
  translation_method: {
    type: String,
    enum: ['ocr', 'text', 'voice'],
    default: 'text'
  },
  week_number: {
    type: Number,
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índice compuesto para consultas de score semanal
TranslationSchema.index({ user_id: 1, week_number: 1, year: 1 });

// Método estático para obtener número de semana ISO
TranslationSchema.statics.getCurrentWeek = function() {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return { week, year: now.getFullYear() };
};

// Método estático para obtener score semanal
TranslationSchema.statics.getWeeklyScore = async function(userId) {
  const { week, year } = this.getCurrentWeek();
  const count = await this.countDocuments({ 
    user_id: userId, 
    week_number: week, 
    year: year 
  });
  return count;
};

// Método estático para obtener score total
TranslationSchema.statics.getTotalScore = async function(userId) {
  const count = await this.countDocuments({ user_id: userId });
  return count;
};

module.exports = mongoose.model('Translation', TranslationSchema);
