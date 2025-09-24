const { runAllSeeders } = require('../seeders');

// Ejecutar todos los seeders
const executeSeed = async (req, res) => {
  try {
    const result = await runAllSeeders();
    res.status(201).json({
      message: 'Seeders ejecutados correctamente',
      ...result
    });
  } catch (error) {
    console.error('Error en seeders:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al ejecutar seeders' 
    });
  }
};

module.exports = { executeSeed };