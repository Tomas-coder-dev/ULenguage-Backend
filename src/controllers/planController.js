const Plan = require('../models/Plan');

// Obtener todos los planes disponibles
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Plans] Consulta de planes (${plans.length} encontrados)`);
    } else {
      console.log(`[PROD][Plans] Consulta de planes`);
    }
    res.status(200).json(plans);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Plans][ERROR]', error);
    } else {
      console.error('[PROD][Plans][ERROR]', error.message);
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getPlans };