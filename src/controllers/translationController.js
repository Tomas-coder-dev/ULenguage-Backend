const Translation = require('../models/Translation');

/**
 * @desc   Registrar una nueva traducción
 * @route  POST /api/translations
 * @access Private
 */
const recordTranslation = async (req, res) => {
  console.log('[📝 TRANSLATION] Registrando nueva traducción');
  
  try {
    const { from_lang, to_lang, original_text, translated_text, translation_method = 'text' } = req.body;
    const userId = req.user._id;

    // Validar datos requeridos
    if (!from_lang || !to_lang || !original_text || !translated_text) {
      console.log('[❌ TRANSLATION] Faltan datos requeridos');
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: from_lang, to_lang, original_text, translated_text' 
      });
    }

    // Validar idiomas
    const validLangs = ['quechua', 'spanish', 'english'];
    if (!validLangs.includes(from_lang) || !validLangs.includes(to_lang)) {
      console.log('[❌ TRANSLATION] Idioma no válido');
      return res.status(400).json({ 
        message: 'Idioma no válido. Debe ser: quechua, spanish o english' 
      });
    }

    // Obtener semana actual
    const { week, year } = Translation.getCurrentWeek();

    // Crear traducción
    const translation = await Translation.create({
      user_id: userId,
      from_lang,
      to_lang,
      original_text,
      translated_text,
      translation_method,
      week_number: week,
      year
    });

    console.log(`[✅ TRANSLATION] Traducción registrada: ${translation._id}`);

    // Obtener score semanal actualizado
    const weeklyScore = await Translation.getWeeklyScore(userId);

    res.status(201).json({
      message: 'Traducción registrada exitosamente',
      translation,
      weeklyScore
    });
  } catch (error) {
    console.error('[❌ TRANSLATION] Error al registrar traducción:', error.message);
    res.status(500).json({ 
      message: 'Error al registrar traducción. Intenta nuevamente.' 
    });
  }
};

/**
 * @desc   Obtener score semanal de traducciones
 * @route  GET /api/translations/weekly-score
 * @access Private
 */
const getWeeklyScore = async (req, res) => {
  console.log('[📊 TRANSLATION] Obteniendo score semanal');
  
  try {
    const userId = req.user._id;
    const weeklyScore = await Translation.getWeeklyScore(userId);
    const { week, year } = Translation.getCurrentWeek();

    console.log(`[✅ TRANSLATION] Score semanal: ${weeklyScore}`);

    res.status(200).json({
      weeklyScore,
      week,
      year
    });
  } catch (error) {
    console.error('[❌ TRANSLATION] Error al obtener score semanal:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener score semanal. Intenta nuevamente.' 
    });
  }
};

/**
 * @desc   Obtener historial de traducciones del usuario
 * @route  GET /api/translations/history
 * @access Private
 */
const getTranslationHistory = async (req, res) => {
  console.log('[📖 TRANSLATION] Obteniendo historial de traducciones');
  
  try {
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    const translations = await Translation.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Translation.countDocuments({ user_id: userId });

    console.log(`[✅ TRANSLATION] Historial obtenido: ${translations.length} traducciones`);

    res.status(200).json({
      translations,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('[❌ TRANSLATION] Error al obtener historial:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener historial. Intenta nuevamente.' 
    });
  }
};

module.exports = {
  recordTranslation,
  getWeeklyScore,
  getTranslationHistory
};
