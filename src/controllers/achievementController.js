const Achievement = require('../models/Achievement');
const Zone = require('../models/Zone');
const SiteVisited = require('../models/SiteVisited');

/**
 * @desc   Desbloquear un logro al visitar una zona
 * @route  POST /api/achievements/unlock
 * @access Private
 */
const unlockAchievement = async (req, res) => {
  console.log('[🏆 ACHIEVEMENT] Solicitud de desbloqueo de logro');
  try {
    const { lat, lon, zoneId, method = 'gps' } = req.body;
    const userId = req.user._id;
    console.log(`[🔍 ACHIEVEMENT] Usuario: ${userId} | Zona: ${zoneId} | Método: ${method}`);
    // Validar datos requeridos
    if (lat === undefined || lon === undefined || !zoneId) {
      console.log('[❌ ACHIEVEMENT] Faltan datos requeridos');
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: lat, lon, zoneId' 
      });
    }
    // Verificar si la zona existe
    const zone = await Zone.findOne({ zone_id: zoneId, active: true });
    if (!zone) {
      console.log(`[❌ ACHIEVEMENT] Zona no encontrada o inactiva: ${zoneId}`);
      return res.status(404).json({ 
        message: 'Zona no encontrada o inactiva' 
      });
    }
    // Verificar si el usuario ya tiene este logro
    const hasAchievement = await Achievement.hasAchievement(userId, zoneId);
    if (hasAchievement) {
      console.log(`[⚠️ ACHIEVEMENT] Usuario ya tiene este logro: ${zoneId}`);
      return res.status(400).json({ 
        message: 'Ya has desbloqueado este logro',
        achievement: await Achievement.findOne({ user_id: userId, zone_id: zoneId })
      });
    }
    // Verificar si está dentro del radio (solo para GPS)
    if (method === 'gps') {
      const isWithinRadius = zone.isWithinRadius(lon, lat);
      if (!isWithinRadius) {
        console.log(`[❌ ACHIEVEMENT] Usuario fuera del radio de la zona: ${zoneId}`);
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

    // Registrar sitio visitado automáticamente
    try {
      const hasVisited = await SiteVisited.hasVisited(userId, zoneId);
      if (!hasVisited) {
        await SiteVisited.create({
          user_id: userId,
          zone_id: zoneId,
          zone_name_es: zone.name_es,
          zone_name_en: zone.name_en,
          coordinates: zone.coordinates,
          visit_method: method,
          visited_at: new Date()
        });
        console.log(`[✅ SITE] Sitio visitado registrado: ${zone.name_es}`);
      }
    } catch (siteError) {
      console.warn('[⚠️ SITE] Error al registrar sitio visitado, continuando:', siteError.message);
    }

    console.log(`[✅ ACHIEVEMENT] Logro desbloqueado exitosamente: ${zone.name_es} | Usuario: ${userId}`);
    res.status(201).json({
      message: '🎉 ¡Logro desbloqueado!',
      achievement,
      reward: zone.reward_content
    });
  } catch (error) {
    console.error('[❌ ACHIEVEMENT] Error al desbloquear logro:', error.message);
    res.status(500).json({ 
      message: 'Error al desbloquear logro. Intenta nuevamente.'
    });
  }
};

/**
 * @desc   Sincronizar logros offline
 * @route  POST /api/achievements/sync
 * @access Private
 */
const syncOfflineAchievements = async (req, res) => {
  console.log('[🔄 ACHIEVEMENT] Iniciando sincronización de logros offline');
  try {
    const { achievements } = req.body; // Array de logros offline
    const userId = req.user._id;
    if (!Array.isArray(achievements) || achievements.length === 0) {
      console.log('[❌ ACHIEVEMENT] No se recibieron logros para sincronizar');
      return res.status(400).json({ 
        message: 'No se enviaron logros para sincronizar' 
      });
    }
    console.log(`[🔍 ACHIEVEMENT] Sincronizando ${achievements.length} logros del usuario: ${userId}`);
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
        console.error('[❌ ACHIEVEMENT] Error al procesar logro individual:', error.message);
        results.failed.push({ 
          zoneId: offlineAchievement.zoneId, 
          reason: 'Error al procesar este logro' 
        });
      }
    }
    console.log(`[✅ ACHIEVEMENT] Sincronización completada: ${results.synced.length} exitosos, ${results.failed.length} fallidos, ${results.duplicates.length} duplicados`);
    res.status(200).json({
      message: 'Sincronización completada',
      results
    });
  } catch (error) {
    console.error('[❌ ACHIEVEMENT] Error general en sincronización:', error.message);
    res.status(500).json({ 
      message: 'Error al sincronizar logros. Intenta nuevamente.'
    });
  }
};

/**
 * @desc   Obtener logros del usuario autenticado
 * @route  GET /api/achievements/me
 * @access Private
 */
const getUserAchievements = async (req, res) => {
  console.log(`[🏆 ACHIEVEMENT] ===== INICIO GET /api/achievements/me =====`);
  console.log(`[🏆 ACHIEVEMENT] Usuario autenticado: ${req.user._id}`);
  console.log(`[🏆 ACHIEVEMENT] Email del usuario: ${req.user.email}`);
  
  try {
    const userId = req.user._id;
    const User = require('../models/User');
    
    // Obtener datos del usuario con sus achievements y zonesVisited
    const user = await User.findById(userId).select('achievements zonesVisited translations savedPhrases').lean();
    console.log(`[📊 USER] Logros generales: ${user?.achievements?.length || 0}`);
    console.log(`[📊 USER] Zonas visitadas: ${user?.zonesVisited?.length || 0}`);
    
    // Log de la consulta exacta para Achievement collection
    console.log(`[🔍 ACHIEVEMENT] Buscando en MongoDB: { user_id: ObjectId("${userId}") }`);
    
    const achievements = await Achievement.find({ user_id: userId })
      .sort({ unlock_at: -1 })
      .lean();
    
    console.log(`[📊 ACHIEVEMENT] Logros de zonas desbloqueados: ${achievements.length}`);
    
    if (achievements.length === 0) {
      console.log(`[⚠️ ACHIEVEMENT] No se encontraron logros de zonas para user_id: ${userId}`);
    } else {
      console.log(`[✅ ACHIEVEMENT] Primeros 2 logros:`, achievements.slice(0, 2).map(a => ({
        zone: a.zone_name_es,
        fecha: a.unlock_at
      })));
    }
    
    const stats = {
      total: achievements.length,
      byMethod: {
        gps: achievements.filter(a => a.unlock_method === 'gps').length,
        qr: achievements.filter(a => a.unlock_method === 'qr').length
      },
      totalRewards: {
        badges: achievements.length,
        discounts: achievements.reduce((sum, a) => sum + (a.content_unlocked?.discount || 0), 0)
      },
      // Agregar estadísticas del User
      userStats: {
        generalAchievements: user?.achievements?.length || 0,
        zonesVisited: user?.zonesVisited?.length || 0,
        translations: user?.translations?.length || 0,
        savedPhrases: user?.savedPhrases?.length || 0
      }
    };
    
    console.log(`[✅ ACHIEVEMENT] Estadísticas completas:`, stats);
    console.log(`[🏆 ACHIEVEMENT] ===== FIN GET /api/achievements/me =====`);
    
    res.status(200).json({
      achievements, // Logros de zonas desbloqueadas
      generalAchievements: user?.achievements || [], // Logros generales del usuario
      zonesVisited: user?.zonesVisited || [], // Zonas visitadas
      translations: user?.translations || [],
      savedPhrases: user?.savedPhrases || [],
      stats
    });
  } catch (error) {
    console.error('[❌ ACHIEVEMENT] Error al obtener logros del usuario:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener tus logros. Intenta nuevamente.'
    });
  }
};

/**
 * @desc   Obtener zonas cercanas
 * @route  GET /api/zones/nearby
 * @access Public
 */
const getNearbyZones = async (req, res) => {
  console.log('[📍 ZONES] Solicitando zonas cercanas');
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
    console.error('[Achievement][GetNearbyZones][ERROR]', error);
    res.status(500).json({ 
      message: 'Error al buscar zonas cercanas. Intenta nuevamente.'
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
    console.error('[Achievement][GetAllZones][ERROR]', error);
    res.status(500).json({ 
      message: 'Error al obtener zonas. Intenta nuevamente.'
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
