const Achievement = require('../models/Achievement');
const Translation = require('../models/Translation');
const SiteVisited = require('../models/SiteVisited');
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
    
    // Obtener score semanal de traducciones
    const weeklyTranslations = await Translation.getWeeklyScore(userId);
    const totalTranslations = await Translation.getTotalScore(userId);
    
    // Obtener sitios visitados
    const placesExplored = await SiteVisited.getVisitCount(userId);
    
    const stats = {
      achievements: achievements.length,
      translations: weeklyTranslations, // Score semanal
      totalTranslations: totalTranslations, // Total histórico
      placesExplored: placesExplored,
      culturalLevel: _calculateCulturalLevel(achievements.length, placesExplored, totalTranslations),
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
 * Calcula el nivel cultural basado en logros, lugares explorados y traducciones
 */
function _calculateCulturalLevel(achievementCount, placesCount, translationsCount) {
  const totalScore = achievementCount + placesCount + Math.floor(translationsCount / 10);
  
  if (totalScore === 0) return 'Explorador Novato';
  if (totalScore < 5) return 'Explorador Cultural';
  if (totalScore < 10) return 'Conocedor Cultural';
  if (totalScore < 20) return 'Embajador Cultural';
  return 'Maestro Cultural';
}

module.exports = {
  getUserStats
};
