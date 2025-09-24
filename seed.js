const mongoose = require('mongoose');
const { runAllSeeders } = require('./src/seeders');

// Conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/ulenguage', {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Ejecutar seeders
const main = async () => {
  try {
    await connectDB();
    await runAllSeeders();
    console.log('🎉 Proceso de seeders completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error en seeders:', error.message);
    process.exit(1);
  }
};

main();