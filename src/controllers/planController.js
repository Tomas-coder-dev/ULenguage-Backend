const Plan = require('../models/Plan');

// Obtener todos los planes disponibles
const getPlans = async (req, res) => {
  console.log('[💳 PLANS] Solicitando lista de planes');
  
  try {
    const plans = await Plan.find();
    console.log(`[✅ PLANS] ${plans.length} planes encontrados y enviados`);
    res.status(200).json(plans);
  } catch (error) {
    console.error('[❌ PLANS] Error al obtener planes:', error.message);
    res.status(500).json({ message: 'Error al obtener planes. Intenta nuevamente.' });
  }
};

module.exports = { getPlans };