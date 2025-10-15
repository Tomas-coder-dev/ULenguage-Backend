const User = require('../models/User');
const bcrypt = require('bcryptjs');

const users = [
  {
    name: 'Admin Tester',
    email: 'admin@ulenguage.com',
    password: bcrypt.hashSync('admin123', 10),
    plan: 'premium',
    googleId: null,
    avatar: '',
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
