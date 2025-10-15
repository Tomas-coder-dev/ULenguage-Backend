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
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Seed][ERROR]', error);
    } else {
      console.error('[PROD][Seed][ERROR]', error.message);
    }
    res.status(500).json({ 
      message: 'Error interno del servidor al ejecutar seeders' 
    });
  }
};

module.exports = { executeSeed };