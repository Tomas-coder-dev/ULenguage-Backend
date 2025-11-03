const { seedPlans } = require('./planSeeder');
const { seedContent } = require('./contentSeeder');
const seedZones = require('./zoneSeeder');
const seedAchievements = require('./achievementSeeder');
const seedUsers = require('./userSeeder');
const seedQuechua = require('./quechuaSeeder');
const { seedNews } = require('./newsSeed');

const runAllSeeders = async () => {
  try {
    console.log('🌱 Iniciando proceso de seeders...');
    
    // Sembrar usuarios
    await seedUsers();

    // Sembrar planes
    await seedPlans();

    // Sembrar contenido cultural
    await seedContent();

    // Sembrar zonas turísticas
    await seedZones();

    // Sembrar logros (achievements)
    await seedAchievements();

    // Sembrar diccionario Quechua
    await seedQuechua();

    // Sembrar noticias culturales
    await seedNews();

    console.log('🎉 Todos los seeders completados exitosamente');
    
    return {
      success: true,
      message: 'Base de datos sembrada correctamente',
      timestamp: new Date()
    };
  } catch (error) {
    console.error('💥 Error en el proceso de seeders:', error.message || error);
    throw error;
  }
};

module.exports = { runAllSeeders };

// Ejecutable directamente desde la CLI: node src/seeders/index.js
if (require.main === module) {
  // Si quieres forzar la URI desde la línea de comandos, exporta MONGO_URI en la sesión antes de ejecutar.
  runAllSeeders()
    .then(res => {
      console.log('✅ runAllSeeders result:', res);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ runAllSeeders fallo:', err);
      process.exit(1);
    });
}