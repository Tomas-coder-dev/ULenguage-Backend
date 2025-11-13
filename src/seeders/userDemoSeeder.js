const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Translation = require('../models/Translation');
const SiteVisited = require('../models/SiteVisited');

const demoUser = {
  name: 'Andres Alexander Huancahuari Quinonez',
  email: 'andres.huancahuari@tecsup.edu.pe',
  password: bcrypt.hashSync('demo123', 10),
  plan: 'free',
  googleId: '111043878585027252113',
  avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIZ4KNNsjkekJXi3bMfnldmasBNs7vM3oFrQEidy9Cv892jYo8=s96-c',
};

const achievements = [
  {
    zone_id: 'sacsayhuaman',
    zone_name_es: 'Sacsayhuamán',
    zone_name_en: 'Sacsayhuaman',
    coordinates: [-71.9811, -13.5094],
    radius_m: 200,
    unlock_method: 'gps',
    unlock_at: new Date(),
    sync_at: new Date(),
    content_unlocked: {
      badge: '🏛️ Explorador de Sacsayhuamán',
      phrase: 'Sacsayhuamán nisqaqa hatun pirqakuna kapun',
      audio_url: '',
      discount: 5
    }
  },
  {
    zone_id: 'machu_picchu',
    zone_name_es: 'Machu Picchu',
    zone_name_en: 'Machu Picchu',
    coordinates: [-72.5450, -13.1631],
    radius_m: 200,
    unlock_method: 'gps',
    unlock_at: new Date(Date.now() - 86400000), // ayer
    sync_at: new Date(Date.now() - 86400000),
    content_unlocked: {
      badge: '🏞️ Explorador de Machu Picchu',
      phrase: 'Machu Picchu nisqaqa sumaq llaqta',
      audio_url: '',
      discount: 10
    }
  }
];

const translations = [
  {
    from_lang: 'quechua',
    to_lang: 'spanish',
    original_text: 'Allin punchaw',
    translated_text: 'Buen día',
    translation_method: 'text',
    createdAt: new Date(Date.now() - 86400000) // ayer
  },
  {
    from_lang: 'spanish',
    to_lang: 'quechua',
    original_text: 'Hola',
    translated_text: 'Rimaykullayki',
    translation_method: 'text',
    createdAt: new Date()
  },
  {
    from_lang: 'quechua',
    to_lang: 'english',
    original_text: 'Imaynalla kashanki',
    translated_text: 'How are you',
    translation_method: 'ocr',
    createdAt: new Date()
  }
];

const sitesVisited = [
  {
    zone_id: 'qorikancha',
    zone_name_es: 'Qorikancha',
    zone_name_en: 'Qorikancha',
    coordinates: [-71.9675, -13.5186],
    visit_method: 'gps',
    visited_at: new Date(Date.now() - 86400000) // ayer
  },
  {
    zone_id: 'sacsayhuaman',
    zone_name_es: 'Sacsayhuamán',
    zone_name_en: 'Sacsayhuaman',
    coordinates: [-71.9811, -13.5094],
    visit_method: 'gps',
    visited_at: new Date()
  }
];

const seedDemoUser = async () => {
  try {
    // Buscar o crear usuario demo
    let user = await User.findOne({ email: demoUser.email });
    if (!user) {
      user = await User.create(demoUser);
      console.log('✅ Usuario demo creado:', user.email);
    } else {
      console.log('ℹ️ Usuario demo ya existe:', user.email);
    }

    // Insertar logros si no existen
    for (const ach of achievements) {
      const exists = await Achievement.findOne({ user_id: user._id, zone_id: ach.zone_id });
      if (!exists) {
        await Achievement.create({ ...ach, user_id: user._id });
        console.log('✅ Logro creado para zona:', ach.zone_id);
      } else {
        console.log('ℹ️ Logro ya existe para zona:', ach.zone_id);
      }
    }

    // Insertar traducciones
    const { week, year } = Translation.getCurrentWeek();
    for (const t of translations) {
      const exists = await Translation.findOne({ 
        user_id: user._id, 
        original_text: t.original_text 
      });
      if (!exists) {
        await Translation.create({ 
          ...t, 
          user_id: user._id,
          week_number: week,
          year
        });
        console.log('✅ Traducción creada:', t.original_text);
      } else {
        console.log('ℹ️ Traducción ya existe:', t.original_text);
      }
    }

    // Insertar sitios visitados
    for (const s of sitesVisited) {
      const exists = await SiteVisited.findOne({ user_id: user._id, zone_id: s.zone_id });
      if (!exists) {
        await SiteVisited.create({ ...s, user_id: user._id });
        console.log('✅ Sitio visitado:', s.zone_id);
      } else {
        console.log('ℹ️ Sitio ya visitado:', s.zone_id);
      }
    }

    console.log('🎉 Seeder demo finalizado');
  } catch (error) {
    console.error('❌ Error en seeder demo:', error);
    throw error;
  }
};

module.exports = seedDemoUser;

// Ejecutable: node src/seeders/userDemoSeeder.js
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ulenguage')
    .then(() => seedDemoUser())
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
