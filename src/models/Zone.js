const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  zone_id: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  name_es: { 
    type: String, 
    required: true 
  },
  name_en: { 
    type: String, 
    required: true 
  },
  description_es: {
    type: String,
    default: ''
  },
  description_en: {
    type: String,
    default: ''
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
  category: {
    type: String,
    enum: ['archaeological', 'natural', 'cultural', 'religious', 'urban'],
    default: 'cultural'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  qr_code: {
    type: String,
    default: ''
  },
  reward_content: {
    badge: { type: String, required: true },
    phrase: { type: String, required: true },
    audio_url: { type: String, default: '' },
    discount: { type: Number, default: 0 }
  },
  active: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Método estático para buscar zonas cercanas
ZoneSchema.statics.findNearby = async function(longitude, latitude, maxDistance = 5000) {
  return await this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    active: true
  });
};

// Método para verificar si coordenadas están dentro del radio
ZoneSchema.methods.isWithinRadius = function(longitude, latitude) {
  const [zoneLng, zoneLat] = this.coordinates;
  const R = 6371000; // Radio de la Tierra en metros
  
  const dLat = (latitude - zoneLat) * Math.PI / 180;
  const dLon = (longitude - zoneLng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(zoneLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= this.radius_m;
};

module.exports = mongoose.model('Zone', ZoneSchema);
