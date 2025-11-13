const SiteVisited = require('../models/SiteVisited');
const Zone = require('../models/Zone');

/**
 * @desc   Registrar visita a un sitio
 * @route  POST /api/sites/visit
 * @access Private
 */
const recordSiteVisit = async (req, res) => {
  console.log('[📍 SITE] Registrando visita a sitio');
  
  try {
    const { zone_id, lat, lon, visit_method = 'gps' } = req.body;
    const userId = req.user._id;

    console.log(`[🔍 SITE] Usuario: ${userId} | Zona: ${zone_id} | Método: ${visit_method}`);

    // Validar datos requeridos
    if (!zone_id) {
      console.log('[❌ SITE] Falta zone_id');
      return res.status(400).json({ 
        message: 'Falta zone_id' 
      });
    }

    // Verificar si la zona existe
    const zone = await Zone.findOne({ zone_id, active: true });
    if (!zone) {
      console.log(`[❌ SITE] Zona no encontrada: ${zone_id}`);
      return res.status(404).json({ 
        message: 'Zona no encontrada o inactiva' 
      });
    }

    // Verificar si ya visitó esta zona
    const hasVisited = await SiteVisited.hasVisited(userId, zone_id);
    if (hasVisited) {
      console.log(`[⚠️ SITE] Usuario ya visitó esta zona: ${zone_id}`);
      return res.status(400).json({ 
        message: 'Ya has visitado este sitio',
        visit: await SiteVisited.findOne({ user_id: userId, zone_id })
      });
    }

    // Verificar radio si es GPS
    if (visit_method === 'gps' && lat !== undefined && lon !== undefined) {
      const isWithinRadius = zone.isWithinRadius(lon, lat);
      if (!isWithinRadius) {
        console.log(`[❌ SITE] Usuario fuera del radio: ${zone_id}`);
        return res.status(400).json({ 
          message: 'No estás dentro del área del sitio',
          distance_hint: 'Debes estar más cerca del lugar'
        });
      }
    }

    // Registrar visita
    const visit = await SiteVisited.create({
      user_id: userId,
      zone_id,
      zone_name_es: zone.name_es,
      zone_name_en: zone.name_en,
      coordinates: zone.coordinates,
      visit_method,
      visited_at: new Date()
    });

    console.log(`[✅ SITE] Visita registrada: ${visit._id}`);

    // Obtener conteo actualizado
    const visitCount = await SiteVisited.getVisitCount(userId);

    res.status(201).json({
      message: 'Visita registrada exitosamente',
      visit,
      totalVisits: visitCount
    });
  } catch (error) {
    console.error('[❌ SITE] Error al registrar visita:', error.message);
    res.status(500).json({ 
      message: 'Error al registrar visita. Intenta nuevamente.' 
    });
  }
};

/**
 * @desc   Obtener sitios visitados por el usuario
 * @route  GET /api/sites/visited
 * @access Private
 */
const getVisitedSites = async (req, res) => {
  console.log('[📍 SITE] Obteniendo sitios visitados');
  
  try {
    const userId = req.user._id;
    const visits = await SiteVisited.getUserVisits(userId);
    const totalVisits = visits.length;

    console.log(`[✅ SITE] Sitios visitados: ${totalVisits}`);

    res.status(200).json({
      visits,
      totalVisits
    });
  } catch (error) {
    console.error('[❌ SITE] Error al obtener sitios visitados:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener sitios visitados. Intenta nuevamente.' 
    });
  }
};

/**
 * @desc   Obtener conteo de sitios visitados
 * @route  GET /api/sites/count
 * @access Private
 */
const getVisitCount = async (req, res) => {
  console.log('[📊 SITE] Obteniendo conteo de sitios visitados');
  
  try {
    const userId = req.user._id;
    const count = await SiteVisited.getVisitCount(userId);

    console.log(`[✅ SITE] Conteo: ${count}`);

    res.status(200).json({
      visitCount: count
    });
  } catch (error) {
    console.error('[❌ SITE] Error al obtener conteo:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener conteo. Intenta nuevamente.' 
    });
  }
};

module.exports = {
  recordSiteVisit,
  getVisitedSites,
  getVisitCount
};
