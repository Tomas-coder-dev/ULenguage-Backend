const User = require('../models/User');
const Plan = require('../models/Plan');
const News = require('../models/News');
const QuechuaCusqueno = require('../models/QuechuaCusqueno');
const Achievement = require('../models/Achievement');
const Zone = require('../models/Zone');
const Translation = require('../models/Translation');

/**
 * @desc    Obtener métricas del dashboard
 * @route   GET /api/admin/metrics
 * @access  Private (Admin)
 */
const getDashboardMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ plan: { $ne: 'free' } });
    const totalAchievements = await Achievement.countDocuments();
    const totalTranslations = await Translation.countDocuments();
    const totalZones = await Zone.countDocuments();
    const totalNews = await News.countDocuments();
    const totalDictionary = await QuechuaCusqueno.countDocuments();

    // Calcular ingresos estimados (asumiendo $9.99 por usuario premium)
    const estimatedRevenue = premiumUsers * 9.99;
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) : 0;

    // Actividad reciente (últimos 5 usuarios registrados)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    res.json({
      totalUsers,
      premiumUsers,
      totalAchievements,
      totalTranslations,
      totalZones,
      totalNews,
      totalDictionary,
      estimatedRevenue,
      conversionRate,
      recentActivity: recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener métricas', error: error.message });
  }
};

/**
 * @desc    Obtener todos los usuarios
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

/**
 * @desc    Actualizar usuario
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
const updateUser = async (req, res) => {
  try {
    const { name, email, plan, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, plan, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

/**
 * @desc    Eliminar usuario
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

/**
 * @desc    Obtener todos los planes
 * @route   GET /api/admin/plans
 * @access  Private (Admin)
 */
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener planes', error: error.message });
  }
};

/**
 * @desc    Actualizar plan
 * @route   PUT /api/admin/plans/:id
 * @access  Private (Admin)
 */
const updatePlan = async (req, res) => {
  try {
    const { name, price, features, duration_days } = req.body;
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, price, features, duration_days },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar plan', error: error.message });
  }
};

/**
 * @desc    Obtener todas las noticias
 * @route   GET /api/admin/news
 * @access  Private (Admin)
 */
const getNews = async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener noticias', error: error.message });
  }
};

/**
 * @desc    Crear noticia
 * @route   POST /api/admin/news
 * @access  Private (Admin)
 */
const createNews = async (req, res) => {
  try {
    const { title, category, content, date, lang } = req.body;
    const news = await News.create({ title, category, content, date, lang });
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear noticia', error: error.message });
  }
};

/**
 * @desc    Actualizar noticia
 * @route   PUT /api/admin/news/:id
 * @access  Private (Admin)
 */
const updateNews = async (req, res) => {
  try {
    const { title, category, content, date, lang } = req.body;
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { title, category, content, date, lang },
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar noticia', error: error.message });
  }
};

/**
 * @desc    Eliminar noticia
 * @route   DELETE /api/admin/news/:id
 * @access  Private (Admin)
 */
const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }
    res.json({ message: 'Noticia eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar noticia', error: error.message });
  }
};

/**
 * @desc    Obtener diccionario quechua
 * @route   GET /api/admin/dictionary
 * @access  Private (Admin)
 */
const getDictionary = async (req, res) => {
  try {
    const dictionary = await QuechuaCusqueno.find().sort({ quechua: 1 });
    res.json(dictionary);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener diccionario', error: error.message });
  }
};

/**
 * @desc    Crear palabra en diccionario
 * @route   POST /api/admin/dictionary
 * @access  Private (Admin)
 */
const createWord = async (req, res) => {
  try {
    const { quechua, spanish, english, category, audio_url } = req.body;
    const word = await QuechuaCusqueno.create({ quechua, spanish, english, category, audio_url });
    res.status(201).json(word);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear palabra', error: error.message });
  }
};

/**
 * @desc    Actualizar palabra en diccionario
 * @route   PUT /api/admin/dictionary/:id
 * @access  Private (Admin)
 */
const updateWord = async (req, res) => {
  try {
    const { quechua, spanish, english, category, audio_url } = req.body;
    const word = await QuechuaCusqueno.findByIdAndUpdate(
      req.params.id,
      { quechua, spanish, english, category, audio_url },
      { new: true, runValidators: true }
    );

    if (!word) {
      return res.status(404).json({ message: 'Palabra no encontrada' });
    }

    res.json(word);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar palabra', error: error.message });
  }
};

/**
 * @desc    Eliminar palabra del diccionario
 * @route   DELETE /api/admin/dictionary/:id
 * @access  Private (Admin)
 */
const deleteWord = async (req, res) => {
  try {
    const word = await QuechuaCusqueno.findByIdAndDelete(req.params.id);
    if (!word) {
      return res.status(404).json({ message: 'Palabra no encontrada' });
    }
    res.json({ message: 'Palabra eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar palabra', error: error.message });
  }
};

/**
 * @desc    Obtener todos los logros
 * @route   GET /api/admin/achievements
 * @access  Private (Admin)
 */
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find()
      .populate('user_id', 'name email')
      .populate('zone_id', 'name_es name_en')
      .sort({ unlock_at: -1 });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener logros', error: error.message });
  }
};

/**
 * @desc    Obtener todas las zonas
 * @route   GET /api/admin/zones
 * @access  Private (Admin)
 */
const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ name_es: 1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener zonas', error: error.message });
  }
};

/**
 * @desc    Crear zona
 * @route   POST /api/admin/zones
 * @access  Private (Admin)
 */
const createZone = async (req, res) => {
  try {
    const { name_es, name_en, coordinates, radius_m, active, reward_content } = req.body;
    const zone = await Zone.create({ name_es, name_en, coordinates, radius_m, active, reward_content });
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear zona', error: error.message });
  }
};

/**
 * @desc    Actualizar zona
 * @route   PUT /api/admin/zones/:id
 * @access  Private (Admin)
 */
const updateZone = async (req, res) => {
  try {
    const { name_es, name_en, coordinates, radius_m, active, reward_content } = req.body;
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { name_es, name_en, coordinates, radius_m, active, reward_content },
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }

    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar zona', error: error.message });
  }
};

/**
 * @desc    Eliminar zona
 * @route   DELETE /api/admin/zones/:id
 * @access  Private (Admin)
 */
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }
    res.json({ message: 'Zona eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar zona', error: error.message });
  }
};

module.exports = {
  getDashboardMetrics,
  getUsers,
  updateUser,
  deleteUser,
  getPlans,
  updatePlan,
  getNews,
  createNews,
  updateNews,
  deleteNews,
  getDictionary,
  createWord,
  updateWord,
  deleteWord,
  getAchievements,
  getZones,
  createZone,
  updateZone,
  deleteZone,
};
