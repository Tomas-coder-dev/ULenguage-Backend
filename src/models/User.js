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
    sparse: true, // Permite que sea único pero también null
    unique: true 
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
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
