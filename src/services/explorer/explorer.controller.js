const axios = require('axios');
const { getPlaceDescriptionIA } = require('../ocr/gemini.service'); // Ajusta la ruta si es necesario

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Endpoint para listar solo lugares turísticos de Cusco usando Google Places API
exports.getPlaces = async (req, res) => {
  try {
    // Coordenadas de Cusco
    const lat = -13.53195;
    const lng = -71.967463;
    const radius = 30000; // 30km

    // Puedes agregar filtros de tipo desde query si quieres más flexibilidad
    const type = req.query.type || "tourist_attraction";

    // Llamada a Google Places Nearby Search
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await axios.get(url);

    // Puedes agregar paginación usando pageToken si hay más resultados (response.data.next_page_token)
    // Por ahora solo se usan los primeros 20 (limitación de la API)

    // Procesa los lugares y agrega descripción IA
    const places = await Promise.all(response.data.results.map(async (place) => {
      let description = {};
      try {
        description = await getPlaceDescriptionIA(place.name);
      } catch {
        description = {
          es: "Descripción no disponible por el momento.",
          en: "Description not available at the moment.",
          qu: "Manaraq kashanmi willakuy."
        };
      }

      return {
        name: place.name,
        image: place.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : null,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`,
        },
        category: place.types?.[0] || "",
        rating: place.rating,
        reviewsCount: place.user_ratings_total,
        description, // {es, en, qu}
      };
    }));

    res.json({ places });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener lugares turísticos de Cusco', details: err.message });
  }
};