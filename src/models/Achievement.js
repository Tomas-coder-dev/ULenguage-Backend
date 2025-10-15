const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  zone_id: { 
    type: String, 
    required: true,
    index: true
  },
  zone_name_es: { 
    type: String, 
    required: true 
  },
  zone_name_en: { 
    type: String, 
    required: true 
  },
  coordinates: {
    type: [Number], // [longitude, latitude] formato GeoJSON
    required: true,
    index: '2dsphere'
  },
  radius_m: { 
    type: Number, 
    required: true,
    default: 150
  },
  unlock_method: { 
    type: String, 
    enum: ['gps', 'qr'],
    required: true
  },
  unlock_at: { 
    type: Date, 
    required: true,
    index: true
  },
  sync_at: { 
    type: Date,
    default: null
  },
  content_unlocked: {
    badge: { type: String, required: true },
    phrase: { type: String, required: true },
    audio_url: { type: String, default: '' },
    discount: { type: Number, default: 0 }
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índice compuesto para evitar duplicados
AchievementSchema.index({ user_id: 1, zone_id: 1 }, { unique: true });

// Método para verificar si un logro ya existe
AchievementSchema.statics.hasAchievement = async function(userId, zoneId) {
  const achievement = await this.findOne({ user_id: userId, zone_id: zoneId });
  return !!achievement;
};

module.exports = mongoose.model('Achievement', AchievementSchema);
