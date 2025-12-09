/**
 * explorer.controller.js
 *
 * Controlador unificado que soporta:
 *  - source=db      => devuelve lugares desde colección Zone (MongoDB)
 *  - source=places  => consulta solo Google Places
 *  - source=both    => combina BD + Google Places
 *  - source vacío   => por defecto combina BD + Google Places si hay API key,
 *                      o solo BD si no hay GOOGLE_PLACES_API_KEY
 *
 * Soporta filtros: types, location, radius, details=true, details_count, page_token, query
 */

const axios = require('axios');
const util = require('util');
const { getPlaceDescriptionIA } = require('../ocr/gemini.service');
const Zone = require('../../models/Zone');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
console.log('[ULenguage] GOOGLE_PLACES_API_KEY:', GOOGLE_PLACES_API_KEY ? `${GOOGLE_PLACES_API_KEY.slice(0,3)}...${GOOGLE_PLACES_API_KEY.slice(-3)}` : '(no definida)');
const DESCRIPTION_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas
const descriptionCache = new Map();
const placeDetailsCache = new Map(); // cache para place details

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
  descriptionCache.set(placeKey, {
    value,
    expiresAt: Date.now() + DESCRIPTION_CACHE_TTL_MS,
  });
}

function getCachedPlaceDetails(placeId) {
  const entry = placeDetailsCache.get(placeId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    placeDetailsCache.delete(placeId);
    return null;
  }
  return entry.value;
}
function setCachedPlaceDetails(placeId, value) {
  placeDetailsCache.set(placeId, {
    value,
    expiresAt: Date.now() + DESCRIPTION_CACHE_TTL_MS,
  });
}

/**
 * Helper: dedupe places by place_id or id preservando el primero
 */
function dedupePlaces(placesArray) {
  const map = new Map();
  for (const p of placesArray) {
    if (!p) continue;
    const id = p.place_id || p.id;
    if (!id) continue;
    if (!map.has(id)) map.set(id, p);
  }
  return Array.from(map.values());
}

/**
 * Build photo URL from photo_reference
 */
function buildPhotoUrl(photoReference, maxWidth = 800) {
  if (!photoReference) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(
    photoReference
  )}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Build google maps URLs
 */
function buildGoogleMapsSearchUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    lat
  )},${encodeURIComponent(lng)}`;
}
function buildGoogleMapsDirectionsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    lat
  )},${encodeURIComponent(lng)}`;
}

/**
 * Fetch Place Details from Google Places API for a given place_id.
 * Returns an object with: name, address, phone, opening_hours, website, rating,
 * price_level, photos (url), types, location, has_parking, googleMapsUrl, directionsUrl
 */
async function fetchPlaceDetails(placeId) {
  if (!placeId) return null;

  const cached = getCachedPlaceDetails(placeId);
  if (cached) return cached;

  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  const fields = [
    'name',
    'formatted_address',
    'formatted_phone_number',
    'international_phone_number',
    'opening_hours',
    'website',
    'rating',
    'price_level',
    'photo',
    'types',
    'geometry',
    'vicinity',
  ].join(',');

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const resp = await axios.get(url, { timeout: 8000 });
    const result = resp.data && resp.data.result ? resp.data.result : null;
    if (!result) {
      return null;
    }

    let photos = [];
    if (Array.isArray(result.photos) && result.photos.length > 0) {
      photos = result.photos.map((p) => ({
        photo_reference: p.photo_reference,
        url: buildPhotoUrl(p.photo_reference, 1200),
        width: p.width || null,
        height: p.height || null,
        html_attributions: p.html_attributions || [],
      }));
    }

    const location = result.geometry?.location
      ? { lat: result.geometry.location.lat, lng: result.geometry.location.lng }
      : null;

    const details = {
      id: placeId,
      name: result.name || null,
      vicinity: result.vicinity || null,
      address: result.formatted_address || null,
      phone:
        result.formatted_phone_number || result.international_phone_number || null,
      opening_hours: result.opening_hours || null,
      website: result.website || null,
      rating: typeof result.rating === 'number' ? result.rating : null,
      price_level:
        typeof result.price_level === 'number' ? result.price_level : null,
      photos,
      types: Array.isArray(result.types) ? result.types : [],
      location,
      googleMapsUrl: location
        ? buildGoogleMapsSearchUrl(location.lat, location.lng)
        : null,
      directionsUrl: location
        ? buildGoogleMapsDirectionsUrl(location.lat, location.lng)
        : null,
    };

    // Heurística simple para detectar "parking/cochera":
    const typesLower = (details.types || []).map((t) =>
      String(t).toLowerCase()
    );
    const nameVicinity = `${details.name || ''} ${
      details.vicinity || ''
    }`.toLowerCase();
    details.has_parking = false;
    if (typesLower.includes('parking')) details.has_parking = true;
    if (
      /\b(parking|estacionamiento|cochera|garage|garaje)\b/i.test(nameVicinity)
    ) {
      details.has_parking = true;
    }

    setCachedPlaceDetails(placeId, details);
    return details;
  } catch (err) {
    console.warn(
      '[ExplorerService] fetchPlaceDetails error for',
      placeId,
      err?.response?.status || err?.message || err
    );
    return null;
  }
}

/**
 * Helper: persiste lugares de Google Places en Zone (MongoDB) si son nuevos.
 * Deduplica por place_id; no inserta si ya existe.
 */
async function persistPlacesToDb(placesFromPlaces) {
  if (!Array.isArray(placesFromPlaces) || placesFromPlaces.length === 0) {
    return;
  }

  try {
    const placeIds = placesFromPlaces
      .map((p) => p.id)
      .filter((id) => id != null);
    if (placeIds.length === 0) return;

    // Buscar cuáles ya existen en la BD por google_place_id
    const existing = await Zone.find({
      google_place_id: { $in: placeIds },
    })
      .select('google_place_id')
      .lean();
    const existingSet = new Set(
      existing.map((z) => z.google_place_id).filter(Boolean)
    );

    const newPlaces = placesFromPlaces.filter(
      (p) => p.id && !existingSet.has(p.id)
    );

    if (newPlaces.length === 0) {
      console.log(
        '[🗺️ EXPLORER] Todos los lugares de Places ya existen en BD.'
      );
      return;
    }

    // Construir documentos Zone a insertar
    const docs = newPlaces.map((p) => ({
      google_place_id: p.id,
      name: p.name || 'Sin nombre',
      name_es: p.name || 'Sin nombre',
      name_en: p.name || 'Unnamed',
      description_es: p.description?.es || '',
      description_en: p.description?.en || '',
      description_qu: p.description?.qu || '',
      fullDescription: p.description || { es: '', en: '', qu: '' },
      category: p.category || 'tourist_attraction',
      coordinates:
        p.location?.lng != null && p.location?.lat != null
          ? [p.location.lng, p.location.lat]
          : null,
      rating: p.rating || null,
      reviewsCount: p.reviewsCount || 0,
      address: p.address || p.vicinity || '',
      phone: p.phone || null,
      opening_hours: p.opening_hours || null,
      website: p.website || null,
      photos: p.photos || [],
      image:
        Array.isArray(p.photos) && p.photos.length > 0
          ? p.photos[0].url || null
          : null,
      active: true,
    }));

    await Zone.insertMany(docs, { ordered: false });
    console.log(
      `[🗺️ EXPLORER] Insertados ${docs.length} nuevos lugares de Google Places a BD.`
    );
  } catch (err) {
    // insertMany con ordered:false continúa tras duplicados; si hay error 11000 (duplicate key) lo ignoramos parcialmente
    if (err.code === 11000 || err.writeErrors) {
      const inserted = err.result?.nInserted || 0;
      console.warn(
        `[🗺️ EXPLORER] Insertados ${inserted} lugares; algunos ya existían (duplicados ignorados).`
      );
    } else {
      console.error(
        '[🗺️ EXPLORER] Error al persistir lugares de Places:',
        err?.message || err
      );
    }
  }
}

/**
 * Helper: calcula la distancia en metros entre dos puntos geográficos usando la fórmula de Haversine
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * GET /api/explorer
 *
 * source=db:
 *   - usa Zone (MongoDB) + query (texto)
 * source=places:
 *   - usa solo Google Places
 * source=both o vacío:
 *   - intenta combinar BD + Google Places (si hay GOOGLE_PLACES_API_KEY)
 *
 * Parámetros adicionales:
 *   - page: número de página (default 1)
 *   - limit: cantidad de resultados por página (default 15)
 *   - sortBy: 'distance' | 'rating' (default: distance para Places, rating para DB)
 *   - location: lat,lng del usuario (si no se envía, usa centro de Cusco)
 */
async function getPlaces(req, res) {
  try {
    const source = (req.query.source || '').toString().toLowerCase();
    const query = req.query.query
      ? req.query.query.toString().toLowerCase()
      : null;
    
    // Paginación
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy || '').toString().toLowerCase() || 'distance';

    console.log('[🗺️ EXPLORER] REQUEST → source=%s, query=%s, types=%s, location=%s, page=%d, limit=%d, sortBy=%s', 
      source || '(none)', 
      query ? `"${query}"` : '(none)',
      req.query.types || '(none)',
      req.query.location || '(none)',
      page,
      limit,
      sortBy
    );

    const hasPlacesKey = !!GOOGLE_PLACES_API_KEY;

    const wantDb =
      source === 'db' ||
      source === 'both' ||
      (!source && true); // por defecto, siempre BD

    const wantPlaces =
      (source === 'places' ||
        source === 'both' ||
        (!source && hasPlacesKey)) &&
      hasPlacesKey;

    console.log('[🗺️ EXPLORER] DECISION → wantDb=%s, wantPlaces=%s (hasKey=%s)', 
      wantDb, wantPlaces, hasPlacesKey
    );

    // ---- 1) Flujo BD (Zone), si se desea ----
    const dbPromise = wantDb
      ? (async () => {
          // Punto de referencia: si el usuario envía location, lo usamos; si no, centro de Cusco
          let refLat = -13.5319;
          let refLng = -71.9675;
          if (req.query.location) {
            const parts = String(req.query.location).split(',');
            if (parts.length === 2) {
              const a = parseFloat(parts[0]);
              const b = parseFloat(parts[1]);
              if (!isNaN(a) && !isNaN(b)) {
                refLat = a;
                refLng = b;
              }
            }
          }

          let filter = { active: true };
          
          // Filtro por tipos/categorías
          const typesParam = req.query.types || req.query.type;
          if (typesParam) {
            const types = String(typesParam)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            if (types.length > 0) {
              filter.category = { $in: types };
            }
          }

          // Filtro por query text
          if (query) {
            filter.$or = [
              { name_es: { $regex: query, $options: 'i' } },
              { name_en: { $regex: query, $options: 'i' } },
              { description_es: { $regex: query, $options: 'i' } },
              { description_en: { $regex: query, $options: 'i' } },
              { category: { $regex: query, $options: 'i' } },
            ];
          }

          const zones = await Zone.find(filter)
            .select('-__v -created_at -updated_at -qr_code')
            .lean();

          // Calcular distancia a cada lugar
          const zonesWithDistance = zones
            .map((zone) => {
              if (!Array.isArray(zone.coordinates) || zone.coordinates.length < 2) {
                return { ...zone, distance: 999999 };
              }
              const [lng, lat] = zone.coordinates;
              const dist = calculateDistance(refLat, refLng, lat, lng);
              return { ...zone, distance: dist };
            })
            .filter((z) => z.distance < 10000); // Máximo 10km del punto de referencia

          // Ordenar según sortBy
          let sorted = [];
          if (sortBy === 'rating') {
            sorted = zonesWithDistance.sort((a, b) => {
              const ratingDiff = (b.rating || 0) - (a.rating || 0);
              if (ratingDiff !== 0) return ratingDiff;
              return (a.distance || 0) - (b.distance || 0);
            });
          } else {
            // sortBy === 'distance' o default
            sorted = zonesWithDistance.sort((a, b) => {
              const distDiff = (a.distance || 0) - (b.distance || 0);
              if (distDiff !== 0) return distDiff;
              return (b.rating || 0) - (a.rating || 0);
            });
          }

          // Aplicar paginación
          const paginated = sorted.slice(skip, skip + limit);

          const places = paginated.map((zone) => ({
            id: zone._id?.toString(),
            name: zone.name_es || zone.name_en || zone.name || null,
            image: zone.image || null,
            location: {
              lat: Array.isArray(zone.coordinates) ? zone.coordinates[1] : null,
              lng: Array.isArray(zone.coordinates) ? zone.coordinates[0] : null,
              googleMapsUrl: Array.isArray(zone.coordinates)
                ? `https://www.google.com/maps/search/?api=1&query=${zone.coordinates[1]},${zone.coordinates[0]}`
                : null,
              directionsUrl: Array.isArray(zone.coordinates)
                ? `https://www.google.com/maps/dir/?api=1&destination=${zone.coordinates[1]},${zone.coordinates[0]}`
                : null,
            },
            category: zone.category,
            rating: zone.rating || null,
            reviewsCount: zone.reviewsCount || 0,
            description: {
              es:
                zone.fullDescription?.es ||
                zone.description_es ||
                'Descripción no disponible',
              en:
                zone.fullDescription?.en ||
                zone.description_en ||
                'Description not available',
              qu:
                zone.fullDescription?.qu ||
                zone.description_qu ||
                'Mana willakuy kanchu',
            },
            address: zone.address || null,
            phone: zone.phone || null,
            opening_hours: zone.opening_hours || null,
            website: zone.website || null,
            photos: zone.photos || [],
            distance: zone.distance,
            source: 'db',
          }));

          console.log(`[🗺️ EXPLORER] Lugares obtenidos de BD: ${places.length} (total: ${sorted.length})`);
          return { places, total: sorted.length };
        })()
      : Promise.resolve({ places: [], total: 0 });

    // ---- 2) Flujo Google Places, si se desea y hay API key ----
    const placesPromise = wantPlaces
      ? (async () => {
          console.log('[🗺️ EXPLORER] 🌍 Consultando Google Places API...');
          
          // Ubicación: usuario o centro de Cusco
          let lat = -13.5319;
          let lng = -71.9675;
          if (req.query.location) {
            const parts = String(req.query.location).split(',');
            if (parts.length === 2) {
              const a = parseFloat(parts[0]);
              const b = parseFloat(parts[1]);
              if (!isNaN(a) && !isNaN(b)) {
                lat = a;
                lng = b;
              }
            }
          }

          const radius = parseInt(req.query.radius, 10) || 10000; // 10km por defecto
          const typesParam = req.query.types || req.query.type || '';
          const types = String(typesParam)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          
          // Si no hay tipos o es vacío, obtener de todas las categorías relevantes
          const allCategories = types.length === 0;
          const categoriesToFetch = allCategories 
            ? ['tourist_attraction', 'restaurant', 'lodging', 'cafe', 'bar', 'museum']
            : types;

          console.log('[🗺️ EXPLORER] 📍 Location: %s,%s | Radius: %dm | Types: %s | AllCategories: %s | Query: %s', 
            lat, lng, radius, categoriesToFetch.join(', '), allCategories, query || '(none)'
          );

          const pageToken = req.query.page_token
            ? `&pagetoken=${encodeURIComponent(req.query.page_token)}`
            : '';
          const wantDetails = String(req.query.details || 'true').toLowerCase() === 'true';
          const detailsCount = parseInt(req.query.details_count, 10) || limit;

          // Consultar por cada tipo/categoría
          const requests = categoriesToFetch.map((type) => {
            let url;
            
            // Si hay query text, usar textsearch que es más flexible
            if (query && query.length > 2) {
              const searchQuery = `${query} ${type.replace('_', ' ')} in Cusco Peru`;
              url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
                searchQuery
              )}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_PLACES_API_KEY}${pageToken}`;
            } else {
              // Sin query text, usar nearbysearch con keyword genérico del tipo
              const keywords = {
                'tourist_attraction': 'attraction tourist cusco',
                'restaurant': 'restaurant food cusco',
                'lodging': 'hotel hostel accommodation cusco',
                'cafe': 'cafe coffee cusco',
                'bar': 'bar pub cusco',
                'museum': 'museum gallery cusco'
              };
              const keyword = keywords[type] || type;
              url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${encodeURIComponent(
                type
              )}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_PLACES_API_KEY}${pageToken}`;
            }
            
            return axios
              .get(url, { timeout: 10000 })
              .then((r) => ({ type, data: r.data }))
              .catch((err) => ({ type, error: err }));
          });

          const responses = await Promise.allSettled(requests);

          let resultsByCategory = new Map();
          let nextPageToken = null;
          
          for (const respWrap of responses) {
            if (respWrap.status !== 'fulfilled') {
              console.warn(
                '[ExplorerService] Places request failed:',
                respWrap.reason?.message || respWrap.reason
              );
              continue;
            }
            const resp = respWrap.value;
            if (resp && resp.error) {
              console.warn(
                '[ExplorerService] Places request error for type=%s: %o',
                resp.type,
                resp.error?.response?.status ||
                  resp.error?.message ||
                  resp.error
              );
              continue;
            }
            const data = resp.data || {};
            const results = Array.isArray(data.results) ? data.results : [];
            
            // Agrupar por categoría
            if (!resultsByCategory.has(resp.type)) {
              resultsByCategory.set(resp.type, []);
            }
            resultsByCategory.get(resp.type).push(...results);
            
            if (!nextPageToken && data.next_page_token) {
              nextPageToken = data.next_page_token;
            }
          }

          // Aplicar límite según estrategia: si "Todos", 5 por categoría; si específico, 15
          let combinedResults = [];
          if (allCategories) {
            // Tomar 5 de cada categoría disponible
            for (const [category, results] of resultsByCategory.entries()) {
              const limited = results.slice(0, 5);
              combinedResults = combinedResults.concat(limited);
              console.log(`[🗺️ EXPLORER] Categoría "${category}": ${limited.length} lugares`);
            }
          } else {
            // Tomar todos los resultados y luego paginar
            for (const results of resultsByCategory.values()) {
              combinedResults = combinedResults.concat(results);
            }
          }

          // Deduplicar y ordenar por distancia o rating
          const uniquePlaces = dedupePlaces(combinedResults);
          
          // Calcular distancia a cada lugar
          const placesWithDistance = uniquePlaces.map((place) => {
            const placeLat = place.geometry?.location?.lat;
            const placeLng = place.geometry?.location?.lng;
            if (placeLat == null || placeLng == null) {
              return { ...place, distance: 999999 };
            }
            const dist = calculateDistance(lat, lng, placeLat, placeLng);
            return { ...place, distance: dist };
          });

          // Ordenar según sortBy
          let sorted = [];
          if (sortBy === 'rating') {
            sorted = placesWithDistance.sort((a, b) => {
              const ratingDiff = (b.rating || 0) - (a.rating || 0);
              if (ratingDiff !== 0) return ratingDiff;
              return (a.distance || 0) - (b.distance || 0);
            });
          } else {
            // sortBy === 'distance' o default (Nearby ya ordena por distancia)
            sorted = placesWithDistance.sort((a, b) => {
              const distDiff = (a.distance || 0) - (b.distance || 0);
              if (distDiff !== 0) return distDiff;
              return (b.rating || 0) - (a.rating || 0);
            });
          }

          // Aplicar paginación solo si no es "Todos"
          const paginated = allCategories ? sorted : sorted.slice(skip, skip + limit);

          // IA para descripciones
          const maxIaDescriptions = 30;
          const placesToDescribe = paginated.slice(0, maxIaDescriptions);

          await Promise.allSettled(
            placesToDescribe.map(async (place) => {
              try {
                const placeKey = (
                  place.place_id ||
                  place.name ||
                  `${place.geometry?.location?.lat},${place.geometry?.location?.lng}`
                ).toString();
                let description = getCachedDescription(placeKey);

                const fallbackEs =
                  place.vicinity ||
                  place.name ||
                  'Descripción no disponible por el momento.';
                const fallbackEn =
                  place.vicinity ||
                  place.name ||
                  'Description not available at the moment.';
                const fallbackQu = 'Descripción no disponible por el momento.';

                if (!description) {
                  try {
                    const raw = await getPlaceDescriptionIA(place);
                    if (raw && typeof raw === 'object') {
                      description = {
                        es:
                          (raw.es && String(raw.es).trim()) ||
                          fallbackEs,
                        en:
                          (raw.en && String(raw.en).trim()) ||
                          fallbackEn,
                        qu:
                          (raw.qu && String(raw.qu).trim()) ||
                          fallbackQu,
                      };
                    } else {
                      description = {
                        es: fallbackEs,
                        en: fallbackEn,
                        qu: fallbackQu,
                      };
                    }
                    setCachedDescription(placeKey, description);
                  } catch (err) {
                    console.warn(
                      '[ExplorerService] getPlaceDescriptionIA failed for %s: %s',
                      place.name,
                      err?.message || err
                    );
                    description = {
                      es: fallbackEs,
                      en: fallbackEn,
                      qu: fallbackQu,
                    };
                    setCachedDescription(placeKey, description);
                  }
                }
              } catch (e) {
                console.warn(
                  '[ExplorerService] describe place error:',
                  e?.message || e
                );
              }
            })
          );

          let detailsMap = new Map();
          if (wantDetails) {
            const toDetails = paginated.slice(0, detailsCount);
            const detailsResults = await Promise.allSettled(
              toDetails.map((p) => fetchPlaceDetails(p.place_id))
            );
            detailsResults.forEach((r, i) => {
              if (r.status === 'fulfilled' && r.value) {
                detailsMap.set(toDetails[i].place_id, r.value);
              } else {
                detailsMap.set(toDetails[i].place_id, null);
              }
            });
          }

          const payloadPlaces = paginated.map((place) => {
            const placeKey = (
              place.place_id ||
              place.name ||
              `${place.geometry?.location?.lat},${place.geometry?.location?.lng}`
            ).toString();

            const description =
              getCachedDescription(placeKey) || {
                es:
                  place.vicinity ||
                  place.name ||
                  'Descripción no disponible por el momento.',
                en:
                  place.vicinity ||
                  place.name ||
                  'Description not available at the moment.',
                qu: 'Descripción no disponible por el momento.',
              };

            const details = detailsMap.has(place.place_id)
              ? detailsMap.get(place.place_id)
              : null;

            const latLoc =
              (details && details.location && details.location.lat) ||
              (place.geometry?.location
                ? place.geometry.location.lat
                : null);
            const lngLoc =
              (details && details.location && details.location.lng) ||
              (place.geometry?.location
                ? place.geometry.location.lng
                : null);

            const googleMapsUrl =
              (details && details.googleMapsUrl) ||
              buildGoogleMapsSearchUrl(latLoc, lngLoc);
            const directionsUrl =
              (details && details.directionsUrl) ||
              buildGoogleMapsDirectionsUrl(latLoc, lngLoc);

            return {
              id: place.place_id,
              name: (details && details.name) || place.name || null,
              vicinity: (details && details.vicinity) || place.vicinity || null,
              address: (details && details.address) || null,
              phone: (details && details.phone) || null,
              opening_hours: (details && details.opening_hours) || null,
              website: (details && details.website) || null,
              rating: (details && details.rating) || place.rating || null,
              price_level:
                (details && details.price_level) || place.price_level || null,
              photos:
                (details && details.photos) ||
                (place.photos
                  ? place.photos.map((p) => ({
                      photo_reference: p.photo_reference,
                      url: buildPhotoUrl(p.photo_reference),
                    }))
                  : []),
              location:
                (details && details.location) ||
                (place.geometry?.location
                  ? {
                      lat: place.geometry.location.lat,
                      lng: place.geometry.location.lng,
                    }
                  : null),
              googleMapsUrl,
              directionsUrl,
              category:
                Array.isArray(place.types) && place.types.length
                  ? place.types[0]
                  : '',
              types:
                (details && details.types) ||
                (Array.isArray(place.types) ? place.types : []),
              has_parking: details ? !!details.has_parking : null,
              reviewsCount: place.user_ratings_total,
              distance: place.distance,
              description,
              source: 'places',
            };
          });

          console.log('[🗺️ EXPLORER] 🌍 Google Places devolvió %d lugares (total: %d)', payloadPlaces.length, sorted.length);
          return { places: payloadPlaces, total: sorted.length, nextPageToken };
        })()
      : Promise.resolve({ places: [], total: 0, nextPageToken: null });

    const [dbResult, placesResult] = await Promise.all([
      dbPromise,
      placesPromise,
    ]);

    const placesFromDb = dbResult.places || [];
    const placesFromPlaces = placesResult.places || [];
    const totalDb = dbResult.total || 0;
    const totalPlaces = placesResult.total || 0;

    // Persistir nuevos lugares de Google Places a MongoDB (en background, no bloqueante)
    if (placesFromPlaces.length > 0) {
      persistPlacesToDb(placesFromPlaces).catch((err) => {
        console.warn(
          '[🗺️ EXPLORER] Persistencia en background falló:',
          err?.message || err
        );
      });
    }

    const allPlaces = [...placesFromDb, ...placesFromPlaces];
    const totalResults = totalDb + totalPlaces;
    const hasMore = (page * limit) < totalResults;

    return res.json({
      places: allPlaces,
      page,
      limit,
      total: totalResults,
      hasMore,
      next_page_token: placesResult.nextPageToken || null,
    });
  } catch (error) {
    console.error(
      '[ExplorerService][ERROR]',
      error?.response?.status || error?.message || error
    );
    const status = error?.response?.status;
    if (status === 403 || status === 401) {
      return res
        .status(502)
        .json({ message: 'Error de autorización con Google Places API.' });
    }
    if (status === 429) {
      return res.status(429).json({
        message: 'Límite de consultas a Google Places alcanzado. Intenta más tarde.',
      });
    }
    return res.status(500).json({
      message: 'Error al obtener lugares turísticos. Intenta nuevamente.',
    });
  }
}

/**
 * GET /api/explorer/details?place_id=xxx
 * Also supports source=db&id=ZONE_ID
 */
async function getPlaceDetailsEndpoint(req, res) {
  try {
    const source = (req.query.source || '').toString().toLowerCase();

    // Detalles desde DB (Zone)
    if (source === 'db') {
      const id = req.query.id;
      if (!id) {
        return res
          .status(400)
          .json({ message: "Falta parámetro 'id' para source=db" });
      }
      const zone = await Zone.findById(id)
        .select('-__v -created_at -updated_at -qr_code')
        .lean();
      if (!zone) {
        return res.status(404).json({ message: 'Zona no encontrada' });
      }
      const details = {
        id: zone._id?.toString(),
        name: zone.name_es || zone.name_en || zone.name || null,
        address: zone.address || null,
        phone: zone.phone || null,
        opening_hours: zone.opening_hours || null,
        website: zone.website || null,
        photos: zone.photos || [],
        location: Array.isArray(zone.coordinates)
          ? { lat: zone.coordinates[1], lng: zone.coordinates[0] }
          : null,
        googleMapsUrl: Array.isArray(zone.coordinates)
          ? `https://www.google.com/maps/search/?api=1&query=${zone.coordinates[1]},${zone.coordinates[0]}`
          : null,
        directionsUrl: Array.isArray(zone.coordinates)
          ? `https://www.google.com/maps/dir/?api=1&destination=${zone.coordinates[1]},${zone.coordinates[0]}`
          : null,
        description: {
          es: zone.fullDescription?.es || zone.description_es || null,
          en: zone.fullDescription?.en || zone.description_en || null,
          qu: zone.fullDescription?.qu || zone.description_qu || null,
        },
      };
      return res.json(details);
    }

    // Detalles desde Google Places
    const placeId = req.query.place_id || req.query.id;
    if (!placeId) {
      return res.status(400).json({ message: "Falta parámetro 'place_id'." });
    }

    const details = await fetchPlaceDetails(placeId);
    if (!details) {
      return res
        .status(404)
        .json({ message: 'Detalles no disponibles para este place_id.' });
    }

    return res.json(details);
  } catch (err) {
    console.error(
      '[ExplorerService][DETAILS][ERROR]',
      err?.message || err
    );
    return res
      .status(500)
      .json({ message: 'Error obteniendo detalles.' });
  }
}

module.exports = {
  getPlaces,
  getPlaceDetailsEndpoint,
};