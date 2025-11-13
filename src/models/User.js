const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String,
    required: function() {
      // Password es requerido solo si no hay googleId
      return !this.googleId;
    },
    minlength: [6, 'Contraseña debe tener ≥ 6 caracteres']
  },
  googleId: { 
    type: String, 
    sparse: true // Permite que sea único pero también null
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Logros generales del usuario (no relacionados con zonas)
  achievements: [{
    name: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  
  // Zonas visitadas por el usuario
  zonesVisited: [{
    zone_id: { type: String, required: true },
    name: { type: String, required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    date: { type: Date, default: Date.now }
  }],
  
  // Traducciones guardadas
  translations: [{
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  
  // Frases guardadas
  savedPhrases: [{
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  // Solo hashear password si existe y fue modificado
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
