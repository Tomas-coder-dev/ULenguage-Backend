/**
 * Script para crear un usuario administrador en MongoDB
 * Ejecutar con: node create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modelo de usuario simplificado
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ulenguage');
    console.log('✅ Conectado a MongoDB');

    // Datos del admin
    const adminEmail = 'admin@ulenguage.com';
    const adminPassword = 'admin123456'; // Cambiar por una contraseña segura
    const adminName = 'Administrador ULenguage';

    // Verificar si ya existe
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  El usuario admin ya existe');
      
      // Actualizar a rol admin si no lo es
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Usuario actualizado a rol admin');
      }
      
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Contraseña: (usa la que ya configuraste)`);
      process.exit(0);
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Crear usuario admin
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      plan: 'premium',
      role: 'admin',
    });

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Contraseña:', adminPassword);
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
