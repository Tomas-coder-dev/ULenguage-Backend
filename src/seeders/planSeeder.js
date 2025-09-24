const Plan = require('../models/Plan');

const planData = [
  {
    name: "Gratuito",
    description: "Plan básico para turistas casuales",
    price: 0,
    features: [
      "OCR 10/día",
      "Traducción básica",
      "Acceso a contenido cultural básico"
    ]
  },
  {
    name: "Premium",
    description: "Plan completo para exploradores culturales",
    price: 5.99,
    features: [
      "OCR ilimitado",
      "Audio pronunciación",
      "Sin anuncios",
      "Contenido cultural exclusivo",
      "Mapa cultural offline",
      "Soporte prioritario"
    ]
  }
];

const seedPlans = async () => {
  try {
    // Limpiar colección existente
    await Plan.deleteMany({});
    
    // Insertar nuevos planes
    const plans = await Plan.insertMany(planData);
    console.log(`✅ ${plans.length} planes insertados correctamente`);
    return plans;
  } catch (error) {
    console.error('❌ Error al sembrar planes:', error.message);
    throw error;
  }
};

module.exports = { seedPlans };