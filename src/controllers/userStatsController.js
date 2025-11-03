const Achievement = require('../models/Achievement');
const User = require('../models/User');

/**
 * @desc   Obtener estadísticas del usuario (logros, traducciones, lugares explorados)
 * @route  GET /api/users/stats
 * @access Private
 */
const getUserStats = async (req, res) => {
  console.log(`[📊 STATS] Solicitando estadísticas del usuario: ${req.user._id}`);
  
  try {
    const userId = req.user._id;
    
    // Obtener logros del usuario
    const achievements = await Achievement.find({ user_id: userId }).lean();
    
    // Contar lugares únicos explorados
    const uniqueZones = new Set(achievements.map(a => a.zone_id));
    const placesExplored = uniqueZones.size;
    
    // TODO: Implementar contador real de traducciones
    // Por ahora, usamos un valor placeholder basado en logros
    const translations = achievements.length * 5; // Simulación
    
    const stats = {
      achievements: achievements.length,
      translations: translations,
      placesExplored: placesExplored,
      culturalLevel: _calculateCulturalLevel(achievements.length, placesExplored),
      lastUpdate: new Date().toISOString()
    };

    console.log(`[✅ STATS] Estadísticas calculadas:`, stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error('[❌ STATS] Error al obtener estadísticas del usuario:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas. Intenta nuevamente.'
    });
  }
};

/**
 * Calcula el nivel cultural basado en logros y lugares explorados
 */
function _calculateCulturalLevel(achievementCount, placesCount) {
  const totalScore = achievementCount + placesCount;
  
  if (totalScore === 0) return 'Explorador Novato';
  if (totalScore < 5) return 'Explorador Cultural';
  if (totalScore < 10) return 'Conocedor Cultural';
  if (totalScore < 20) return 'Embajador Cultural';
  return 'Maestro Cultural';
}

module.exports = {
  getUserStats
};
