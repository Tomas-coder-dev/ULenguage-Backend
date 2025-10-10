const Achievement = require('../models/Achievement');
const Zone = require('../models/Zone');

/**
 * @desc   Desbloquear un logro al visitar una zona
 * @route  POST /api/achievements/unlock
 * @access Private
 */
const unlockAchievement = async (req, res) => {
  try {
    const { lat, lon, zoneId, method = 'gps' } = req.body;
    const userId = req.user._id;

    // Validar datos requeridos
    if (lat === undefined || lon === undefined || !zoneId) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: lat, lon, zoneId' 
      });
    }

    // Verificar si la zona existe
    const zone = await Zone.findOne({ zone_id: zoneId, active: true });
    if (!zone) {
      return res.status(404).json({ 
        message: 'Zona no encontrada o inactiva' 
      });
    }

    // Verificar si el usuario ya tiene este logro
    const hasAchievement = await Achievement.hasAchievement(userId, zoneId);
    if (hasAchievement) {
      return res.status(400).json({ 
        message: 'Ya has desbloqueado este logro',
        achievement: await Achievement.findOne({ user_id: userId, zone_id: zoneId })
      });
    }

    // Verificar si está dentro del radio (solo para GPS)
    if (method === 'gps') {
      const isWithinRadius = zone.isWithinRadius(lon, lat);
      if (!isWithinRadius) {
        return res.status(400).json({ 
          message: 'No estás dentro del área de la zona',
          distance_hint: 'Debes estar más cerca del lugar'
        });
      }
    }

    // Crear el logro
    const achievement = await Achievement.create({
      user_id: userId,
      zone_id: zoneId,
      zone_name_es: zone.name_es,
      zone_name_en: zone.name_en,
      coordinates: zone.coordinates,
      radius_m: zone.radius_m,
      unlock_method: method,
      unlock_at: new Date(),
      sync_at: method === 'gps' ? new Date() : null,
      content_unlocked: zone.reward_content
    });

    res.status(201).json({
      message: '🎉 ¡Logro desbloqueado!',
      achievement,
      reward: zone.reward_content
    });
  } catch (error) {
    console.error('Error al desbloquear logro:', error);
    res.status(500).json({ 
      message: 'Error al desbloquear logro',
      error: error.message 
    });
  }
};

/**
 * @desc   Sincronizar logros offline
 * @route  POST /api/achievements/sync
 * @access Private
 */
const syncOfflineAchievements = async (req, res) => {
  try {
    const { achievements } = req.body; // Array de logros offline
    const userId = req.user._id;

    if (!Array.isArray(achievements) || achievements.length === 0) {
      return res.status(400).json({ 
        message: 'No se enviaron logros para sincronizar' 
      });
    }

    const results = {
      synced: [],
      failed: [],
      duplicates: []
    };

    for (const offlineAchievement of achievements) {
      try {
        const { lat, lon, zoneId, timestamp } = offlineAchievement;

        // Verificar duplicados
        const hasAchievement = await Achievement.hasAchievement(userId, zoneId);
        if (hasAchievement) {
          results.duplicates.push({ zoneId, reason: 'Ya existe' });
          continue;
        }

        // Verificar zona
        const zone = await Zone.findOne({ zone_id: zoneId, active: true });
        if (!zone) {
          results.failed.push({ zoneId, reason: 'Zona no encontrada' });
          continue;
        }

        // Verificar proximidad
        const isWithinRadius = zone.isWithinRadius(lon, lat);
        if (!isWithinRadius) {
          results.failed.push({ zoneId, reason: 'Fuera de rango' });
          continue;
        }

        // Crear logro
        const achievement = await Achievement.create({
          user_id: userId,
          zone_id: zoneId,
          zone_name_es: zone.name_es,
          zone_name_en: zone.name_en,
          coordinates: zone.coordinates,
          radius_m: zone.radius_m,
          unlock_method: 'gps',
          unlock_at: new Date(timestamp),
          sync_at: new Date(),
          content_unlocked: zone.reward_content
        });

        results.synced.push(achievement);
      } catch (error) {
        results.failed.push({ 
          zoneId: offlineAchievement.zoneId, 
          reason: error.message 
        });
      }
    }

    res.status(200).json({
      message: 'Sincronización completada',
      results
    });
  } catch (error) {
    console.error('Error al sincronizar logros:', error);
    res.status(500).json({ 
      message: 'Error al sincronizar logros',
      error: error.message 
    });
  }
};

/**
 * @desc   Obtener logros del usuario autenticado
 * @route  GET /api/achievements/me
 * @access Private
 */
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const achievements = await Achievement.find({ user_id: userId })
      .sort({ unlock_at: -1 })
      .lean();

    const stats = {
      total: achievements.length,
      byMethod: {
        gps: achievements.filter(a => a.unlock_method === 'gps').length,
        qr: achievements.filter(a => a.unlock_method === 'qr').length
      },
      totalRewards: {
        badges: achievements.length,
        discounts: achievements.reduce((sum, a) => sum + (a.content_unlocked?.discount || 0), 0)
      }
    };

    res.status(200).json({
      achievements,
      stats
    });
  } catch (error) {
    console.error('Error al obtener logros:', error);
    res.status(500).json({ 
      message: 'Error al obtener logros',
      error: error.message 
    });
  }
};

/**
 * @desc   Obtener zonas cercanas
 * @route  GET /api/zones/nearby
 * @access Public
 */
const getNearbyZones = async (req, res) => {
  try {
    const { lat, lon, radius = 5000 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        message: 'Faltan parámetros: lat, lon' 
      });
    }

    const zones = await Zone.findNearby(
      parseFloat(lon), 
      parseFloat(lat), 
      parseInt(radius)
    );

    res.status(200).json({
      count: zones.length,
      zones
    });
  } catch (error) {
    console.error('Error al buscar zonas cercanas:', error);
    res.status(500).json({ 
      message: 'Error al buscar zonas cercanas',
      error: error.message 
    });
  }
};

/**
 * @desc   Obtener todas las zonas
 * @route  GET /api/zones
 * @access Public
 */
const getAllZones = async (req, res) => {
  try {
    const zones = await Zone.find({ active: true })
      .select('-qr_code') // Ocultar QR codes por seguridad
      .lean();

    res.status(200).json({
      count: zones.length,
      zones
    });
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ 
      message: 'Error al obtener zonas',
      error: error.message 
    });
  }
};

module.exports = {
  unlockAchievement,
  syncOfflineAchievements,
  getUserAchievements,
  getNearbyZones,
  getAllZones
};
