const mongoose = require('mongoose');

const SiteVisitedSchema = new mongoose.Schema({
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
    type: [Number], // [longitude, latitude]
    required: true
  },
  visit_method: {
    type: String,
    enum: ['gps', 'qr', 'manual'],
    default: 'gps'
  },
  visited_at: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índice único para evitar duplicados (un usuario solo puede visitar una zona una vez)
SiteVisitedSchema.index({ user_id: 1, zone_id: 1 }, { unique: true });

// Método estático para verificar si ya visitó una zona
SiteVisitedSchema.statics.hasVisited = async function(userId, zoneId) {
  const visit = await this.findOne({ user_id: userId, zone_id: zoneId });
  return !!visit;
};

// Método estático para obtener conteo de lugares visitados
SiteVisitedSchema.statics.getVisitCount = async function(userId) {
  const count = await this.countDocuments({ user_id: userId });
  return count;
};

// Método estático para obtener lugares visitados de un usuario
SiteVisitedSchema.statics.getUserVisits = async function(userId) {
  return await this.find({ user_id: userId }).sort({ visited_at: -1 }).lean();
};

module.exports = mongoose.model('SiteVisited', SiteVisitedSchema);
