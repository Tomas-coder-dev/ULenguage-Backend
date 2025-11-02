const { seedPlans } = require('./planSeeder');
const { seedContent } = require('./contentSeeder');
const seedZones = require('./zoneSeeder');
const seedAchievements = require('./achievementSeeder');
const seedUsers = require('./userSeeder');
const seedQuechua = require('./quechuaSeeder'); // <-- nuevo seeder agregado

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