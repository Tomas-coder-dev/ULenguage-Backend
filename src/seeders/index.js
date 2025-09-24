const { seedPlans } = require('./planSeeder');
const { seedContent } = require('./contentSeeder');

const runAllSeeders = async () => {
  try {
    console.log('🌱 Iniciando proceso de seeders...');
    
    // Sembrar planes
    await seedPlans();
    
    // Sembrar contenido cultural
    await seedContent();
    
    console.log('🎉 Todos los seeders completados exitosamente');
    
    return {
      success: true,
      message: 'Base de datos sembrada correctamente',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('💥 Error en el proceso de seeders:', error.message);
    throw error;
  }
};

module.exports = { runAllSeeders };