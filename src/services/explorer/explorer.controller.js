const axios = require('axios');
const { getPlaceDescriptionIA } = require('../ocr/gemini.service');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DESCRIPTION_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas
const descriptionCache = new Map();

function getCachedDescription(placeKey) {
  const entry = descriptionCache.get(placeKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    descriptionCache.delete(placeKey);
    return null;
  }
  return entry.value;
}
function setCachedDescription(placeKey, value) {
  descriptionCache.set(placeKey, { value, expiresAt: Date.now() + DESCRIPTION_CACHE_TTL_MS });
}

exports.getPlaces = async (req, res) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('[ExplorerService] GOOGLE_PLACES_API_KEY no está definida');
      return res.status(500).json({ message: 'Configuración del servidor incompleta (GOOGLE_PLACES_API_KEY).' });
    }

    const lat = -13.53195;
    const lng = -71.967463;
    const radius = 30000; // 30km
    const type = req.query.type || 'tourist_attraction';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await axios.get(url, { timeout: 8000 });
    const results = Array.isArray(response.data.results) ? response.data.results : [];

    const maxIaDescriptions = 6;

    const places = await Promise.all(results.map(async (place, idx) => {
      const placeKey = (place.place_id || place.name || `${place.geometry?.location?.lat},${place.geometry?.location?.lng}`).toString();

      // intentar cache
      let description = getCachedDescription(placeKey);

      if (!description && idx < maxIaDescriptions) {
        try {
          console.log(`[🗺️ EXPLORER] Solicitando descripción IA para: ${place.name}`);
          // PASAR EL OBJETO place (no solo el name)
          description = await getPlaceDescriptionIA(place);
          console.log(`[✅ EXPLORER] Descripción IA obtenida para: ${place.name}`);
          if (description && typeof description === 'object') {
            setCachedDescription(placeKey, description);
          }
        } catch (error) {
          console.error(`[❌ EXPLORER] Error obteniendo descripción para ${place.name}:`, error?.message || error);
          description = {
            es: "Descripción no disponible por el momento.",
            en: "Description not available at the moment.",
            qu: "Descripción no disponible por el momento."
          };
        }
      } else if (!description) {
        // no está en cache y excede el límite de llamadas IA
        description = { es: null, en: null, qu: null };
      }

      return {
        name: place.name,
        image: place.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : null,
        location: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.geometry?.location?.lat},${place.geometry?.location?.lng}`,
        },
        category: Array.isArray(place.types) && place.types.length ? place.types[0] : '',
        rating: place.rating,
        reviewsCount: place.user_ratings_total,
        description,
      };
    }));

    res.json({ places, next_page_token: response.data.next_page_token || null });
  } catch (error) {
    console.error('[ExplorerService][ERROR]', error?.message || error);
    const status = error?.response?.status;
    if (status === 403 || status === 401) {
      return res.status(502).json({ message: 'Error de autorización con Google Places API.' });
    }
    if (status === 429) {
      return res.status(429).json({ message: 'Límite de consultas a Google Places alcanzado. Intenta más tarde.' });
    }
    res.status(500).json({ message: 'Error al obtener lugares turísticos. Intenta nuevamente.' });
  }
};