const Zone = require('../models/Zone');

const zones = [
  {
    zone_id: 'machu_picchu',
    name_es: 'Machu Picchu',
    name_en: 'Machu Picchu',
    description_es: 'Ciudadela inca del siglo XV, una de las Siete Maravillas del Mundo Moderno',
    description_en: '15th-century Inca citadel, one of the Seven Wonders of the Modern World',
    coordinates: [-72.5449, -13.1631], // [longitude, latitude]
    radius_m: 200,
    category: 'archaeological',
    difficulty: 'hard',
    qr_code: 'MP2025',
    reward_content: {
      badge: '🏔️ Explorador Inca',
      phrase: '¡Allin p\'unchay! (Buenos días)',
      audio_url: 'https://cdn.ulenguage.com/audio/machu_picchu.mp3',
      discount: 10
    }
  },
  {
    zone_id: 'sacsayhuaman',
    name_es: 'Sacsayhuamán',
    name_en: 'Sacsayhuaman',
    description_es: 'Complejo arquitectónico inca con enormes bloques de piedra',
    description_en: 'Inca architectural complex with huge stone blocks',
    coordinates: [-71.9822, -13.5088],
    radius_m: 150,
    category: 'archaeological',
    difficulty: 'easy',
    qr_code: 'SH2025',
    reward_content: {
      badge: '🗿 Guardián de Piedra',
      phrase: 'Wayna Qhapaq (Joven poderoso)',
      audio_url: 'https://cdn.ulenguage.com/audio/sacsayhuaman.mp3',
      discount: 5
    }
  },
  {
    zone_id: 'qorikancha',
    name_es: 'Qorikancha',
    name_en: 'Qorikancha',
    description_es: 'Templo del Sol, antiguo centro religioso inca',
    description_en: 'Temple of the Sun, ancient Inca religious center',
    coordinates: [-71.9675, -13.5189],
    radius_m: 100,
    category: 'religious',
    difficulty: 'easy',
    qr_code: 'QK2025',
    reward_content: {
      badge: '☀️ Hijo del Sol',
      phrase: 'Inti Raymi (Fiesta del Sol)',
      audio_url: 'https://cdn.ulenguage.com/audio/qorikancha.mp3',
      discount: 8
    }
  },
  {
    zone_id: 'valle_sagrado',
    name_es: 'Valle Sagrado',
    name_en: 'Sacred Valley',
    description_es: 'Valle del río Urubamba, corazón del imperio inca',
    description_en: 'Urubamba River valley, heart of the Inca empire',
    coordinates: [-71.9847, -13.3198],
    radius_m: 300,
    category: 'natural',
    difficulty: 'medium',
    qr_code: 'VS2025',
    reward_content: {
      badge: '🌄 Caminante del Valle',
      phrase: 'Urubamba mayu (Río sagrado)',
      audio_url: 'https://cdn.ulenguage.com/audio/valle_sagrado.mp3',
      discount: 7
    }
  },
  {
    zone_id: 'ollantaytambo',
    name_es: 'Ollantaytambo',
    name_en: 'Ollantaytambo',
    description_es: 'Fortaleza inca con terrazas agrícolas impresionantes',
    description_en: 'Inca fortress with impressive agricultural terraces',
    coordinates: [-72.2636, -13.2570],
    radius_m: 150,
    category: 'archaeological',
    difficulty: 'medium',
    qr_code: 'OT2025',
    reward_content: {
      badge: '🏯 Conquistador de Alturas',
      phrase: 'Patallaqta (Ciudad en las alturas)',
      audio_url: 'https://cdn.ulenguage.com/audio/ollantaytambo.mp3',
      discount: 6
    }
  },
  {
    zone_id: 'pisac',
    name_es: 'Pisac',
    name_en: 'Pisac',
    description_es: 'Ruinas incas y mercado artesanal tradicional',
    description_en: 'Inca ruins and traditional artisan market',
    coordinates: [-71.8479, -13.4211],
    radius_m: 150,
    category: 'cultural',
    difficulty: 'easy',
    qr_code: 'PS2025',
    reward_content: {
      badge: '🛍️ Comerciante Inca',
      phrase: 'Qhatu (Mercado)',
      audio_url: 'https://cdn.ulenguage.com/audio/pisac.mp3',
      discount: 5
    }
  },
  {
    zone_id: 'plaza_armas_cusco',
    name_es: 'Plaza de Armas de Cusco',
    name_en: 'Cusco Main Square',
    description_es: 'Centro histórico de Cusco, antigua plaza inca',
    description_en: 'Historic center of Cusco, former Inca plaza',
    coordinates: [-71.9675, -13.5164],
    radius_m: 100,
    category: 'urban',
    difficulty: 'easy',
    qr_code: 'PA2025',
    reward_content: {
      badge: '🏛️ Ciudadano Imperial',
      phrase: 'Qosqo (Ombligo del mundo)',
      audio_url: 'https://cdn.ulenguage.com/audio/plaza_armas.mp3',
      discount: 3
    }
  },
  {
    zone_id: 'laguna_humantay',
    name_es: 'Laguna Humantay',
    name_en: 'Humantay Lake',
    description_es: 'Laguna turquesa de origen glaciar en los Andes',
    description_en: 'Turquoise glacial lake in the Andes',
    coordinates: [-72.5864, -13.3447],
    radius_m: 200,
    category: 'natural',
    difficulty: 'hard',
    qr_code: 'LH2025',
    reward_content: {
      badge: '💧 Guardián de Aguas',
      phrase: 'Qucha (Laguna)',
      audio_url: 'https://cdn.ulenguage.com/audio/humantay.mp3',
      discount: 12
    }
  },
  {
    zone_id: 'montaña_colores',
    name_es: 'Montaña de Colores',
    name_en: 'Rainbow Mountain',
    description_es: 'Vinicunca, montaña multicolor a 5200 msnm',
    description_en: 'Vinicunca, multicolored mountain at 5200 masl',
    coordinates: [-71.3028, -13.8689],
    radius_m: 250,
    category: 'natural',
    difficulty: 'hard',
    qr_code: 'MC2025',
    reward_content: {
      badge: '🌈 Caminante Arcoíris',
      phrase: 'Vinicunca (Cerro de colores)',
      audio_url: 'https://cdn.ulenguage.com/audio/vinicunca.mp3',
      discount: 15
    }
  },
  {
    zone_id: 'moray',
    name_es: 'Moray',
    name_en: 'Moray',
    description_es: 'Laboratorio agrícola inca con terrazas circulares',
    description_en: 'Inca agricultural laboratory with circular terraces',
    coordinates: [-72.1950, -13.3289],
    radius_m: 120,
    category: 'archaeological',
    difficulty: 'medium',
    qr_code: 'MR2025',
    reward_content: {
      badge: '🌾 Sabio Agricultor',
      phrase: 'Chakra (Campo de cultivo)',
      audio_url: 'https://cdn.ulenguage.com/audio/moray.mp3',
      discount: 6
    }
  }
];

const seedZones = async () => {
  try {
    await Zone.deleteMany({});
    const created = await Zone.insertMany(zones);
    console.log(`✅ ${created.length} zonas turísticas creadas`);
    return created;
  } catch (error) {
    console.error('❌ Error al sembrar zonas:', error);
    throw error;
  }
};

module.exports = seedZones;
