const Plan = require('../models/Plan');

// Obtener todos los planes disponibles
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { getPlans };