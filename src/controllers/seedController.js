const { runAllSeeders } = require('../seeders');

// Ejecutar todos los seeders
const executeSeed = async (req, res) => {
  try {
    const result = await runAllSeeders();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Seed] Seeders ejecutados correctamente`, result);
    } else {
      console.log(`[PROD][Seed] Seeders ejecutados`);
    }
    res.status(201).json({
      message: 'Seeders ejecutados correctamente',
      ...result
    });
  } catch (error) {
    console.error('[Seed][ERROR]', error);
    res.status(500).json({ 
      message: 'Error al ejecutar seeders. Intenta nuevamente.' 
    });
  }
};

module.exports = { executeSeed };