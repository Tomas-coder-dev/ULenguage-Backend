const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Zone = require('../models/Zone');

const seedAchievements = async () => {
  try {
    await Achievement.deleteMany({});
    const users = await User.find({});
    const zones = await Zone.find({});
    if (!users.length || !zones.length) {
      console.log('⚠️ No hay usuarios o zonas para crear logros');
      return [];
    }
    const now = new Date();
    const achievements = [];
    // Un logro por usuario y por zona (puedes ajustar la lógica)
    users.forEach(user => {
      zones.forEach(zone => {
        achievements.push({
          user_id: user._id,
          zone_id: zone.zone_id,
          zone_name_es: zone.name_es,
          zone_name_en: zone.name_en,
          coordinates: zone.coordinates,
          radius_m: zone.radius_m,
          unlock_method: 'gps',
          unlock_at: now,
          sync_at: null,
          content_unlocked: {
            badge: zone.reward_content.badge,
            phrase: zone.reward_content.phrase,
            audio_url: zone.reward_content.audio_url,
            discount: zone.reward_content.discount || 0
          }
        });
      });
    });
    const created = await Achievement.insertMany(achievements);
    console.log(`✅ ${created.length} logros creados`);
    return created;
  } catch (error) {
    console.error('❌ Error al sembrar logros:', error);
    throw error;
  }
};

module.exports = seedAchievements;
