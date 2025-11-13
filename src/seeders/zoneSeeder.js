const Zone = require('../models/Zone');

const zones = [
  {
    zone_id: 'machu_picchu',
    name_es: 'Machu Picchu',
    name_en: 'Machu Picchu',
    description_es: 'Ciudadela inca del siglo XV, una de las Siete Maravillas del Mundo Moderno',
    description_en: '15th-century Inca citadel, one of the Seven Wonders of the Modern World',
    description_qu: 'Machu Picchu nisqaqa huk hatun llaqta karqan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg',
    rating: 4.8,
    reviewsCount: 125000,
    fullDescription: {
      es: `Machu Picchu es una ciudadela inca del siglo XV ubicada en la Cordillera Oriental del sur de Perú. Es el sitio turístico más visitado del país y uno de los destinos más emblemáticos del mundo.

📍 Cómo llegar:
• Desde Cusco: Tren turístico desde Ollantaytambo (2 horas) o caminata por el Camino Inca (4 días)
• Bus desde Aguas Calientes: 30 minutos de ascenso

🎫 Horarios y tarifas:
• Horario: 6:00 AM - 5:30 PM
• Tarifa extranjeros: S/ 152 (~$40)
• Tarifa peruanos: S/ 64
• Requiere reserva anticipada

👨‍🏫 Guías recomendados:
• Tours oficiales incluyen guía certificado
• Duración promedio: 2-3 horas
• Idiomas: Español, inglés, francés, portugués

💡 Consejos:
• Llegar temprano para evitar multitudes
• Llevar agua, protector solar y sombrero
• Respetar las áreas restringidas
• No está permitido ingresar con comida`,
      en: `Machu Picchu is a 15th-century Inca citadel located in the Eastern Cordillera of southern Peru. It is the most visited tourist site in the country and one of the most iconic destinations in the world.

📍 How to get there:
• From Cusco: Tourist train from Ollantaytambo (2 hours) or Inca Trail trek (4 days)
• Bus from Aguas Calientes: 30-minute ascent

🎫 Hours and rates:
• Schedule: 6:00 AM - 5:30 PM
• Foreign visitors: S/ 152 (~$40)
• Peruvian citizens: S/ 64
• Advanced booking required

👨‍🏫 Recommended guides:
• Official tours include certified guide
• Average duration: 2-3 hours
• Languages: Spanish, English, French, Portuguese

💡 Tips:
• Arrive early to avoid crowds
• Bring water, sunscreen and hat
• Respect restricted areas
• Food not allowed inside`,
      qu: `Machu Picchu nisqaqa huk hatun llaqta karqan, chay llaqtataqa Inka runakunam ruwarqanku. Kunanmi astawan watukuq turistakuna chay llaqtaman rinku tukuy Perú suyumanta.

📍 Imaynatas chayayta:
• Qusqumantas: Tren turistico Ollantaytambotas (iskay hora)
• Bus Aguas Calientesmanta: kimsa chunka minutu

💡 Yuyaychakuy:
• Paqarin chayamuy mana achkha runakunawan kananpaq
• Yakuta apamuy`
    },
    coordinates: [-72.5449, -13.1631], // [longitude, latitude]
    radius_m: 200,
    category: 'archaeological',
    difficulty: 'hard',
    qr_code: 'MP2025',
    reward_content: {
      badge: '🏔️ Explorador Inca',
      phrase: '¡Allin p\'unchay! (Buenos días)',
      audio_url: 'https://cdn.ulenguage.com/audio/machu_picchu.mp3',
      discount: 10
    }
  },
  {
    zone_id: 'sacsayhuaman',
    name_es: 'Sacsayhuamán',
    name_en: 'Sacsayhuaman',
    description_es: 'Complejo arquitectónico inca con enormes bloques de piedra',
    description_en: 'Inca architectural complex with huge stone blocks',
    description_qu: 'Sacsayhuamán nisqaqa hatun pukara karqan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Sacsayhuam%C3%A1n.jpg/800px-Sacsayhuam%C3%A1n.jpg',
    rating: 4.7,
    reviewsCount: 45000,
    fullDescription: {
      es: `Fortaleza ceremonial inca construida con bloques masivos de piedra. Ubicada a 2 km del centro de Cusco, ofrece vistas panorámicas de la ciudad.

📍 Cómo llegar:
• Caminata desde Plaza de Armas: 30-40 minutos (empinado)
• Taxi/colectivo: 10 minutos desde el centro
• Bus turístico: Ruta amarilla del City Tour

🎫 Horarios y tarifas:
• Horario: 7:00 AM - 6:00 PM
• Incluido en Boleto Turístico del Cusco (S/ 130 extranjeros, S/ 70 peruanos)
• Válido para 10 atractivos durante 10 días

👨‍🏫 Guías turísticos:
• Guías certificados disponibles en la entrada (S/ 40-60 por grupo)
• Tours desde Cusco incluyen transporte + guía (S/ 50-80 por persona)

💡 Datos importantes:
• Sede del Inti Raymi cada 24 de junio
• Piedras más grandes pesan hasta 200 toneladas
• Arquitectura antisísmica impresionante`,
      en: `Inca ceremonial fortress built with massive stone blocks. Located 2 km from downtown Cusco, offers panoramic views of the city.

📍 How to get there:
• Walk from Plaza de Armas: 30-40 minutes (steep)
• Taxi/shared transport: 10 minutes from downtown
• Tourist bus: Yellow route City Tour

🎫 Hours and rates:
• Schedule: 7:00 AM - 6:00 PM
• Included in Cusco Tourist Ticket (S/ 130 foreigners, S/ 70 Peruvians)
• Valid for 10 attractions for 10 days

👨‍🏫 Tour guides:
• Certified guides available at entrance (S/ 40-60 per group)
• Tours from Cusco include transport + guide (S/ 50-80 per person)

💡 Important facts:
• Venue for Inti Raymi every June 24th
• Largest stones weigh up to 200 tons
• Impressive earthquake-resistant architecture`,
      qu: `Sacsayhuamán nisqaqa hatun pukara karqan. Iskay kilometro Qusqu llaqtamanta.

💡 Riqsichikuy:
• Inti Raymi raymitaqa chaypi ruranku
• Hatun rumikuna iskay pachak toneladasta llasanku`
    },
    coordinates: [-71.9822, -13.5088],
    radius_m: 150,
    category: 'archaeological',
    difficulty: 'easy',
    qr_code: 'SH2025',
    reward_content: {
      badge: '🗿 Guardián de Piedra',
      phrase: 'Wayna Qhapaq (Joven poderoso)',
      audio_url: 'https://cdn.ulenguage.com/audio/sacsayhuaman.mp3',
      discount: 5
    }
  },
  {
    zone_id: 'qorikancha',
    name_es: 'Qorikancha',
    name_en: 'Qorikancha',
    description_es: 'Templo del Sol, antiguo centro religioso inca',
    description_en: 'Temple of the Sun, ancient Inca religious center',
    description_qu: 'Qorikancha nisqaqa Inti Taytanchikpaq wasi',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Qurikancha.jpg/800px-Qurikancha.jpg',
    rating: 4.6,
    reviewsCount: 32000,
    fullDescription: {
      es: `El templo más importante del Imperio Inca dedicado al dios Sol (Inti). Sobre sus muros incas se construyó el Convento de Santo Domingo.

📍 Ubicación:
• Calle Santo Domingo, a 5 minutos de la Plaza de Armas caminando
• Fácil acceso desde cualquier punto del centro histórico

🎫 Información de visita:
• Horario: Lunes a sábado 8:30 AM - 5:30 PM, Domingo 2:00 PM - 5:00 PM
• Tarifa extranjeros: S/ 15
• Tarifa peruanos: S/ 8
• Estudiantes: 50% descuento con carnet

👨‍🏫 Tours y guías:
• Guías privados en la entrada: S/ 30-50 por grupo
• Audio guías disponibles: S/ 10
• Duración promedio: 45-60 minutos

💡 Dato histórico:
• Las paredes estaban cubiertas con láminas de oro puro
• Centro religioso y astronómico del Tahuantinsuyo`,
      en: `The most important temple of the Inca Empire dedicated to the sun god (Inti). The Santo Domingo Convent was built on top of its Inca walls.

📍 Location:
• Santo Domingo Street, 5-minute walk from Plaza de Armas
• Easy access from anywhere in the historic center

🎫 Visit information:
• Hours: Monday-Saturday 8:30 AM - 5:30 PM, Sunday 2:00 PM - 5:00 PM
• Foreign visitors: S/ 15
• Peruvian citizens: S/ 8
• Students: 50% discount with ID

👨‍🏫 Tours and guides:
• Private guides at entrance: S/ 30-50 per group
• Audio guides available: S/ 10
• Average duration: 45-60 minutes

💡 Historical fact:
• Walls were covered with pure gold sheets
• Religious and astronomical center of Tahuantinsuyo`,
      qu: `Qorikancha nisqaqa Inti Taytanchikpaq wasi karqan.

💡 Yachay:
• Pirqakunaqa quri laminaswan qatasqa karqan`
    },
    coordinates: [-71.9675, -13.5189],
    radius_m: 100,
    category: 'religious',
    difficulty: 'easy',
    qr_code: 'QK2025',
    reward_content: {
      badge: '☀️ Hijo del Sol',
      phrase: 'Inti Raymi (Fiesta del Sol)',
      audio_url: 'https://cdn.ulenguage.com/audio/qorikancha.mp3',
      discount: 8
    }
  },
  {
    zone_id: 'valle_sagrado',
    name_es: 'Valle Sagrado',
    name_en: 'Sacred Valley',
    description_es: 'Valle del río Urubamba, corazón del imperio inca',
    description_en: 'Urubamba River valley, heart of the Inca empire',
    description_qu: 'Valle Sagrado nisqaqa Urubamba mayu pampan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sacred_Valley_Peru.jpg/800px-Sacred_Valley_Peru.jpg',
    rating: 4.9,
    reviewsCount: 68000,
    fullDescription: {
      es: `Valle andino con pueblos pintorescos, sitios arqueológicos y paisajes impresionantes. Incluye Pisac, Ollantaytambo, Chinchero y Moray.

📍 Cómo llegar:
• Tours organizados desde Cusco: Full day (S/ 80-150 incluye transporte, guía y almuerzo)
• Transporte público: Buses desde Terminal Terrestre Cusco a cada pueblo
• Distancia: 15-60 km desde Cusco dependiendo del destino

🎫 Principales atractivos:
• Pisac: Ruinas incas + mercado artesanal
• Ollantaytambo: Fortaleza inca y pueblo vivo
• Moray: Laboratorio agrícola circular
• Maras: Salineras (minas de sal)
• Chinchero: Textiles tradicionales y ruinas

👨‍🏫 Tours recomendados:
• Full day Valle Sagrado: 8:00 AM - 6:00 PM (S/ 120 promedio)
• Incluye: Transporte, guía bilingüe, entradas, almuerzo buffet
• Tours privados disponibles: S/ 250-400 para grupos pequeños

💡 Consejos útiles:
• Requiere Boleto Turístico para ruinas (S/ 130)
• Llevar efectivo para compras en mercados
• Altitud menor que Cusco (mejor aclimatación)`,
      en: `Andean valley with picturesque villages, archaeological sites and stunning landscapes. Includes Pisac, Ollantaytambo, Chinchero and Moray.

📍 How to get there:
• Organized tours from Cusco: Full day (S/ 80-150 includes transport, guide and lunch)
• Public transport: Buses from Cusco Bus Terminal to each town
• Distance: 15-60 km from Cusco depending on destination

🎫 Main attractions:
• Pisac: Inca ruins + craft market
• Ollantaytambo: Inca fortress and living town
• Moray: Circular agricultural laboratory
• Maras: Salt mines
• Chinchero: Traditional textiles and ruins

👨‍🏫 Recommended tours:
• Sacred Valley full day: 8:00 AM - 6:00 PM (S/ 120 average)
• Includes: Transport, bilingual guide, tickets, buffet lunch
• Tours privados available: S/ 250-400 for small groups

💡 Useful tips:
• Requires Tourist Ticket for ruins (S/ 130)
• Bring cash for market purchases
• Lower altitude than Cusco (better acclimatization)`,
      qu: `Valle Sagrado nisqaqa sumaq pampakuna. Pisac, Ollantaytambo, Moray llaqtakuna kanku.

💡 Yachay:
• Boleto Turístico necesitakun
• Qullqi apamuy rantinapaq`
    },
    coordinates: [-71.9847, -13.3198],
    radius_m: 300,
    category: 'natural',
    difficulty: 'medium',
    qr_code: 'VS2025',
    reward_content: {
      badge: '🌄 Caminante del Valle',
      phrase: 'Urubamba mayu (Río sagrado)',
      audio_url: 'https://cdn.ulenguage.com/audio/valle_sagrado.mp3',
      discount: 7
    }
  },
  {
    zone_id: 'laguna_humantay',
    name_es: 'Laguna Humantay',
    name_en: 'Humantay Lake',
    description_es: 'Laguna turquesa de origen glaciar en los Andes',
    description_en: 'Turquoise glacial lake in the Andes',
    description_qu: 'Humantay qucha nisqaqa anqas yaku qucha',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Humantay_Lake.jpg/800px-Humantay_Lake.jpg',
    rating: 4.8,
    reviewsCount: 28000,
    fullDescription: {
      es: `Laguna turquesa de origen glaciar ubicada a 4,200 msnm. Una de las excursiones de un día más populares desde Cusco.

📍 Cómo llegar:
• Tours desde Cusco: Salida 4:00-5:00 AM, retorno 5:00-6:00 PM
• Duración total: 13-14 horas (incluye 3 horas de viaje cada tramo)
• Caminata final: 2 horas ascenso + 1 hora descenso (moderada-difícil)

🎫 Información del tour:
• Precio promedio: S/ 90-130 por persona
• Incluye: Transporte, guía, desayuno, almuerzo, entrada (S/ 20)
• No incluye: Caballo para subir (S/ 70-90 opcional)

⛰️ Datos de la caminata:
• Distancia: 2 km (solo ida)
• Desnivel: 200 metros de ascenso
• Altitud máxima: 4,200 msnm
• Duración caminata: 1.5-2 horas subida

💡 Recomendaciones importantes:
• Aclimatarse 2-3 días en Cusco antes de ir
• Llevar ropa abrigadora (temperatura puede bajar a 0°C)
• Bloqueador solar, sombrero y lentes
• Agua, snacks y hojas de coca`,
      en: `Turquoise glacial lake located at 4,200 masl. One of the most popular day trips from Cusco.

📍 How to get there:
• Tours from Cusco: Departure 4:00-5:00 AM, return 5:00-6:00 PM
• Total duration: 13-14 hours (includes 3 hours travel each way)
• Final hike: 2 hours ascent + 1 hour descent (moderate-difficult)

🎫 Tour information:
• Average price: S/ 90-130 per person
• Includes: Transport, guide, breakfast, lunch, entrance (S/ 20)
• Not included: Horse to ride up (S/ 70-90 optional)

⛰️ Hiking details:
• Distance: 2 km (one way)
• Elevation gain: 200 meters ascent
• Maximum altitude: 4,200 masl
• Hiking duration: 1.5-2 hours up

💡 Important recommendations:
• Acclimatize 2-3 days in Cusco before going
• Bring warm clothing (temperature can drop to 0°C)
• Sunscreen, hat and sunglasses
• Water, snacks and coca leaves`,
      qu: `Humantay qucha nisqaqa anqas yaku qucha, 4,200 metro alturamanta.

💡 Yuyaychakuy:
• Iskay kimsa punchaw Qusqupi kaspa
• Quñi pachakuna apamuy
• Yaku, mikhuna, kuka apamuy`
    },
    coordinates: [-72.5864, -13.3447],
    radius_m: 200,
    category: 'natural',
    difficulty: 'hard',
    qr_code: 'LH2025',
    reward_content: {
      badge: '💧 Guardián de Aguas',
      phrase: 'Qucha (Laguna)',
      audio_url: 'https://cdn.ulenguage.com/audio/humantay.mp3',
      discount: 12
    }
  },
  {
    zone_id: 'ollantaytambo',
    name_es: 'Ollantaytambo',
    name_en: 'Ollantaytambo',
    description_es: 'Fortaleza inca con terrazas agrícolas impresionantes',
    description_en: 'Inca fortress with impressive agricultural terraces',
    description_qu: 'Ollantaytambo nisqaqa hatun pukara',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Ollantaytambo_-_Peru.jpg/800px-Ollantaytambo_-_Peru.jpg',
    rating: 4.7,
    reviewsCount: 18000,
    fullDescription: {
      es: `Fortaleza inca y pueblo vivo con terrazas agrícolas. Punto de partida hacia Machu Picchu.

📍 Cómo llegar:
• Desde Cusco: Bus directo (2 horas, S/ 15-20)
• Tours Valle Sagrado incluyen visita

🎫 Información:
• Horario: 7:00 AM - 6:00 PM
• Incluido en Boleto Turístico del Cusco

👨‍🏫 Guías disponibles:
• En la entrada: S/ 40-60 por grupo`,
      en: `Inca fortress and living town with agricultural terraces. Starting point to Machu Picchu.

📍 How to get there:
• From Cusco: Direct bus (2 hours, S/ 15-20)
• Sacred Valley tours include visit

🎫 Information:
• Schedule: 7:00 AM - 6:00 PM
• Included in Cusco Tourist Ticket

👨‍🏫 Guides available:
• At entrance: S/ 40-60 per group`,
      qu: `Ollantaytambo nisqaqa hatun pukara. Machu Picchuman purinapaq qallariy.`
    },
    coordinates: [-72.2636, -13.2570],
    radius_m: 150,
    category: 'archaeological',
    difficulty: 'medium',
    qr_code: 'OT2025',
    reward_content: {
      badge: '🏯 Conquistador de Alturas',
      phrase: 'Patallaqta (Ciudad en las alturas)',
      audio_url: 'https://cdn.ulenguage.com/audio/ollantaytambo.mp3',
      discount: 6
    }
  },
  {
    zone_id: 'pisac',
    name_es: 'Pisac',
    name_en: 'Pisac',
    description_es: 'Ruinas incas y mercado artesanal tradicional',
    description_en: 'Inca ruins and traditional artisan market',
    description_qu: 'Pisac nisqaqa qhatu hatun',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Pisac_ruins.jpg/800px-Pisac_ruins.jpg',
    rating: 4.6,
    reviewsCount: 22000,
    fullDescription: {
      es: `Ruinas incas espectaculares y mercado artesanal tradicional. Excelente para compras de artesanías.

📍 Cómo llegar:
• Desde Cusco: Bus (1 hora, S/ 5-10)
• Tours Valle Sagrado incluyen visita

🎫 Información:
• Ruinas: Incluido en Boleto Turístico
• Mercado: Gratis, martes/jueves/domingo

👨‍🏫 Recomendaciones:
• Visitar mercado en la mañana
• Regatear precios es esperado`,
      en: `Spectacular Inca ruins and traditional artisan market. Excellent for handicraft shopping.

📍 How to get there:
• From Cusco: Bus (1 hour, S/ 5-10)
• Sacred Valley tours include visit

🎫 Information:
• Ruins: Included in Tourist Ticket
• Market: Free, Tuesday/Thursday/Sunday

👨‍🏫 Recommendations:
• Visit market in the morning
• Bargaining is expected`,
      qu: `Pisac nisqaqa qhatu hatun. Runakunaqa artesanías ranqanku.`
    },
    coordinates: [-71.8479, -13.4211],
    radius_m: 150,
    category: 'cultural',
    difficulty: 'easy',
    qr_code: 'PS2025',
    reward_content: {
      badge: '🛍️ Comerciante Inca',
      phrase: 'Qhatu (Mercado)',
      audio_url: 'https://cdn.ulenguage.com/audio/pisac.mp3',
      discount: 5
    }
  },
  {
    zone_id: 'plaza_armas_cusco',
    name_es: 'Plaza de Armas de Cusco',
    name_en: 'Cusco Main Square',
    description_es: 'Centro histórico de Cusco, antigua plaza inca',
    description_en: 'Historic center of Cusco, former Inca plaza',
    description_qu: 'Qosqo Hawkaypata',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Plaza_de_Armas%2C_Cusco.jpg/800px-Plaza_de_Armas%2C_Cusco.jpg',
    rating: 4.8,
    reviewsCount: 95000,
    fullDescription: {
      es: `Corazón de Cusco, rodeada de iglesias coloniales y portales. Antigua Huacaypata inca.

📍 Ubicación:
• Centro de Cusco
• Acceso peatonal desde cualquier punto

🎫 Actividades:
• Catedral: S/ 25 (lunes a sábado 10 AM - 6 PM)
• Compañía de Jesús: S/ 10
• Free walking tours diarios (propina voluntaria)

👨‍🏫 Recomendaciones:
• Fotografías mejores en la mañana
• Cuidado con vendedores insistentes
• Muchos restaurantes y cafés alrededor`,
      en: `Heart of Cusco, surrounded by colonial churches and arcades. Former Inca Huacaypata.

📍 Location:
• Downtown Cusco
• Pedestrian access from anywhere

🎫 Activities:
• Cathedral: S/ 25 (Monday-Saturday 10 AM - 6 PM)
• La Compañía: S/ 10
• Free walking tours daily (tip-based)

👨‍🏫 Recommendations:
• Best photos in the morning
• Watch out for pushy vendors
• Many restaurants and cafes around`,
      qu: `Qosqo Hawkaypata nisqaqa Qosqo sonqon. Ñawpaqtaqa inkakunaq hatun plaza karqan.`
    },
    coordinates: [-71.9675, -13.5164],
    radius_m: 100,
    category: 'urban',
    difficulty: 'easy',
    qr_code: 'PA2025',
    reward_content: {
      badge: '🏛️ Ciudadano Imperial',
      phrase: 'Qosqo (Ombligo del mundo)',
      audio_url: 'https://cdn.ulenguage.com/audio/plaza_armas.mp3',
      discount: 3
    }
  },
  {
    zone_id: 'montaña_colores',
    name_es: 'Montaña de Colores',
    name_en: 'Rainbow Mountain',
    description_es: 'Vinicunca, montaña multicolor a 5200 msnm',
    description_en: 'Vinicunca, multicolored mountain at 5200 masl',
    description_qu: 'Vinicunca nisqaqa sami sami urqu',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Rainbow_Mountain%2C_Peru.jpg/800px-Rainbow_Mountain%2C_Peru.jpg',
    rating: 4.7,
    reviewsCount: 35000,
    fullDescription: {
      es: `Montaña de colores naturales a 5,200 msnm. Requiere buena condición física.

📍 Cómo llegar:
• Tours desde Cusco: Salida 3:00-4:00 AM
• Duración total: 14-15 horas
• Caminata: 3-4 horas (10 km ida y vuelta)

🎫 Información del tour:
• Precio: S/ 80-120 por persona
• Incluye: Transporte, desayuno, almuerzo, entrada
• Caballo opcional: S/ 80-100

💡 Importante:
• Aclimatarse mínimo 3 días en Cusco
• Llevar ropa muy abrigada
• Altitud extrema (5,200 msnm)`,
      en: `Natural rainbow-colored mountain at 5,200 masl. Requires good physical condition.

📍 How to get there:
• Tours from Cusco: Departure 3:00-4:00 AM
• Total duration: 14-15 hours
• Hike: 3-4 hours (10 km round trip)

🎫 Tour information:
• Price: S/ 80-120 per person
• Includes: Transport, breakfast, lunch, entrance
• Horse optional: S/ 80-100

💡 Important:
• Acclimatize minimum 3 days in Cusco
• Bring very warm clothing
• Extreme altitude (5,200 masl)`,
      qu: `Vinicunca nisqaqa sami sami urqu, 5,200 metro alturamanta.`
    },
    coordinates: [-71.3028, -13.8689],
    radius_m: 250,
    category: 'natural',
    difficulty: 'hard',
    qr_code: 'MC2025',
    reward_content: {
      badge: '🌈 Caminante Arcoíris',
      phrase: 'Vinicunca (Cerro de colores)',
      audio_url: 'https://cdn.ulenguage.com/audio/vinicunca.mp3',
      discount: 15
    }
  },
  {
    zone_id: 'moray',
    name_es: 'Moray',
    name_en: 'Moray',
    description_es: 'Laboratorio agrícola inca con terrazas circulares',
    description_en: 'Inca agricultural laboratory with circular terraces',
    description_qu: 'Moray nisqaqa chakra yachay wasi',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Moray_terraces.jpg/800px-Moray_terraces.jpg',
    rating: 4.5,
    reviewsCount: 15000,
    fullDescription: {
      es: `Terrazas circulares incas usadas como laboratorio agrícola. Cada nivel tiene microclima diferente.

📍 Cómo llegar:
• Tours Valle Sagrado incluyen visita
• Distancia desde Cusco: 50 km (1.5 horas)

🎫 Información:
• Incluido en Boleto Turístico
• Horario: 7:00 AM - 6:00 PM

👨‍🏫 Dato interesante:
• Los incas experimentaban con cultivos aquí
• Diferencia de temperatura de hasta 15°C entre niveles`,
      en: `Circular Inca terraces used as agricultural laboratory. Each level has different microclimate.

📍 How to get there:
• Sacred Valley tours include visit
• Distance from Cusco: 50 km (1.5 hours)

🎫 Information:
• Included in Tourist Ticket
• Schedule: 7:00 AM - 6:00 PM

👨‍🏫 Interesting fact:
• Incas experimented with crops here
• Temperature difference up to 15°C between levels`,
      qu: `Moray nisqaqa chakra yachay wasi karqan. Sapa nivel hukniray pacha kaq.`
    },
    coordinates: [-72.1950, -13.3289],
    radius_m: 120,
    category: 'archaeological',
    difficulty: 'medium',
    qr_code: 'MR2025',
    reward_content: {
      badge: '🌾 Sabio Agricultor',
      phrase: 'Chakra (Campo de cultivo)',
      audio_url: 'https://cdn.ulenguage.com/audio/moray.mp3',
      discount: 6
    }
  }
];

const seedZones = async () => {
  try {
    await Zone.deleteMany({});
    const created = await Zone.insertMany(zones);
    console.log(`✅ ${created.length} zonas turísticas creadas`);
    return created;
  } catch (error) {
    console.error('❌ Error al sembrar zonas:', error);
    throw error;
  }
};

module.exports = seedZones;
