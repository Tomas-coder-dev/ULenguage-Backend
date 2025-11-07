const News = require('../models/News');

/**
 * @desc   Obtener últimas noticias filtradas por idioma
 * @route  GET /api/news?lang=es|en|qu
 * @access Public
 */
const getLatestNews = async (req, res) => {
  try {
    const { lang = 'es', limit = 3 } = req.query;

    // Validar idioma
    const validLanguages = ['es', 'en', 'qu'];
    const language = validLanguages.includes(lang) ? lang : 'es';

    console.log(`[📰 NEWS] Solicitando últimas ${limit} noticias en idioma: ${language}`);

    // Obtener últimas noticias activas por idioma
    const news = await News.find({
      language: language,
      isActive: true
    })
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .select('-__v -createdAt -updatedAt')
      .lean();

    console.log(`[✅ NEWS] ${news.length} noticias encontradas.`);

    res.status(200).json({
      success: true,
      count: news.length,
      language: language,
      data: news
    });
  } catch (error) {
    console.error('[❌ NEWS] Error al obtener noticias:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener noticias. Intenta nuevamente.'
    });
  }
};

/**
 * @desc   Obtener noticia por ID
 * @route  GET /api/news/:id
 * @access Public
 */
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await News.findById(id).select('-__v');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'Noticia no encontrada.'
      });
    }

    // Incrementar contador de vistas
    news.viewCount += 1;
    await news.save();

    console.log(`[📰 NEWS] Noticia obtenida: ${news.title}`);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('[❌ NEWS] Error al obtener noticia:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la noticia.'
    });
  }
};

/**
 * @desc   Crear nueva noticia (solo admin - implementar auth en futuro)
 * @route  POST /api/news
 * @access Private/Admin
 */
const createNews = async (req, res) => {
  try {
    const { title, content, summary, imageUrl, language, category } = req.body;

    // Validaciones básicas
    if (!title || !content || !language) {
      return res.status(400).json({
        success: false,
        message: 'Título, contenido e idioma son obligatorios.'
      });
    }

    const news = await News.create({
      title,
      content,
      summary,
      imageUrl,
      language,
      category
    });

    console.log(`[✅ NEWS] Noticia creada: ${news.title}`);

    res.status(201).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('[❌ NEWS] Error al crear noticia:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al crear la noticia.'
    });
  }
};

module.exports = {
  getLatestNews,
  getNewsById,
  createNews
};
