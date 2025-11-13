const User = require('../models/User');
const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Admin Tester',
    email: 'admin@ulenguage.com',
    password: bcrypt.hashSync('admin123', 10),
    plan: 'premium',
    googleId: null,
    avatar: 'https://i.pinimg.com/474x/1f/44/39/1f443971b930025b430b6857a5ced4d4.jpg',
    role: 'admin',
  },
  {
    name: 'Usuario Demo',
    email: 'demo@ulenguage.com',
    password: bcrypt.hashSync('demo123', 10),
    plan: 'free',
    googleId: null,
    avatar: '',
  }
];

const seedUsers = async () => {
  try {
    await User.deleteMany({});
    const created = await User.insertMany(users);
    console.log(`✅ ${created.length} usuarios creados`);
    return created;
  } catch (error) {
    console.error('❌ Error al sembrar usuarios:', error);
    throw error;
  }
};

module.exports = seedUsers;
