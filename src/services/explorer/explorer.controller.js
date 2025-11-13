const Zone = require('../../models/Zone');

exports.getPlaces = async (req, res) => {
  try {
    const query = req.query.query ? req.query.query.toLowerCase() : null;
    
    // Construir filtro de búsqueda
    let filter = { active: true };
    
    if (query) {
      filter.$or = [
        { name_es: { $regex: query, $options: 'i' } },
        { name_en: { $regex: query, $options: 'i' } },
        { description_es: { $regex: query, $options: 'i' } },
        { description_en: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }

    const zones = await Zone.find(filter)
      .select('-__v -created_at -updated_at -qr_code')
      .sort({ rating: -1, reviewsCount: -1 })
      .lean();

    // Transformar datos de Zone al formato que espera el frontend
    const places = zones.map(zone => ({
      name: zone.name_es, // Nombre por defecto en español
      image: zone.image || null,
      location: {
        lat: zone.coordinates[1], // GeoJSON format: [lng, lat]
        lng: zone.coordinates[0],
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${zone.coordinates[1]},${zone.coordinates[0]}`
      },
      category: zone.category,
      rating: zone.rating || 4.5,
      reviewsCount: zone.reviewsCount || 0,
      description: {
        es: zone.fullDescription?.es || zone.description_es || 'Descripción no disponible',
        en: zone.fullDescription?.en || zone.description_en || 'Description not available',
        qu: zone.fullDescription?.qu || zone.description_qu || 'Mana willakuy kanchu'
      }
    }));

    console.log(`[🗺️ EXPLORER] Lugares obtenidos de BD: ${places.length}`);
    res.json({ places });
  } catch (error) {
    console.error('[EXPLORER][ERROR]', error?.message || error);
    res.status(500).json({ 
      message: 'Error al obtener lugares turísticos. Intenta nuevamente.',
      places: [] 
    });
  }
};