const axios = require('axios');

// Devuelve una lista de lugares turísticos con enlaces de Google Maps
exports.getExplorerSites = async (req, res) => {
  try {
    // Ejemplo: lugares fijos, puedes reemplazar por consulta a una API externa
    const sites = [
      {
        name: 'Sacsayhuamán',
        location: {
          lat: -13.5094,
          lng: -71.9811,
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-13.5094,-71.9811',
        },
        image: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Sacsayhuaman_Cusco_Peru.jpg',
        description: 'Fortaleza ceremonial inca ubicada en Cusco.'
      },
      {
        name: 'Qorikancha',
        location: {
          lat: -13.5186,
          lng: -71.9781,
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-13.5186,-71.9781',
        },
        image: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Qorikancha_Cusco.jpg',
        description: 'Templo del Sol, centro religioso inca.'
      }
    ];
    res.status(200).json({ sites });
  } catch (error) {
    res.status(500).json({ message: 'Error interno al obtener lugares turísticos' });
  }
};
