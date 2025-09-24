const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Usar BD de test cuando NODE_ENV === 'test'
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/ulenguage_test'
      : process.env.MONGO_URI || 'mongodb://localhost:27017/ulenguage';

    await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB conectado: ${process.env.NODE_ENV === 'test' ? 'ulenguage_test' : 'ulenguage'}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
