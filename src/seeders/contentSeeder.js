const Content = require('../models/Content');

const contentData = [
  // SALUDOS
  {
    term: "Allin p'unchay",
    translationEs: "Buenos días",
    translationEn: "Good morning",
    context: "Se usa hasta el mediodía en comunidades rurales de Cusco",
    pronunciation: "AH-lyeen POON-chay",
    category: "saludos"
  },
  {
    term: "Allin tuta",
    translationEs: "Buenas noches",
    translationEn: "Good night",
    context: "Saludo nocturno tradicional andino",
    pronunciation: "AH-lyeen TOO-tah",
    category: "saludos"
  },
  {
    term: "Napaykullayki",
    translationEs: "Te saludo",
    translationEn: "I greet you",
    context: "Saludo formal respetuoso, usado con personas mayores",
    pronunciation: "nah-pay-koo-LLY-kee",
    category: "saludos"
  },
  {
    term: "Imaynalla kashanki",
    translationEs: "¿Cómo estás?",
    translationEn: "How are you?",
    context: "Pregunta común en el saludo cotidiano",
    pronunciation: "ee-may-NAH-lyah kah-SHAHN-kee",
    category: "saludos"
  },
  {
    term: "Allinmi kani",
    translationEs: "Estoy bien",
    translationEn: "I am fine",
    context: "Respuesta típica al saludo",
    pronunciation: "ah-LYEEN-mee KAH-nee",
    category: "saludos"
  },

  // FAMILIA
  {
    term: "Mama",
    translationEs: "Madre",
    translationEn: "Mother",
    context: "Término de respeto para la madre en la cultura andina",
    pronunciation: "MAH-mah",
    category: "familia"
  },
  {
    term: "Tayta",
    translationEs: "Padre",
    translationEn: "Father",
    context: "Término respetuoso para el padre",
    pronunciation: "TAY-tah",
    category: "familia"
  },
  {
    term: "Wawqi",
    translationEs: "Hermano (de hombre)",
    translationEn: "Brother (of man)",
    context: "Usado por hombres para referirse a sus hermanos",
    pronunciation: "WAW-kee",
    category: "familia"
  },
  {
    term: "Pana",
    translationEs: "Hermana (de hombre)",
    translationEn: "Sister (of man)",
    context: "Usado por hombres para referirse a sus hermanas",
    pronunciation: "PAH-nah",
    category: "familia"
  },
  {
    term: "Ñaña",
    translationEs: "Hermana (de mujer)",
    translationEn: "Sister (of woman)",
    context: "Usado por mujeres para referirse a sus hermanas",
    pronunciation: "NYAH-nyah",
    category: "familia"
  },
  {
    term: "Turi",
    translationEs: "Hermano (de mujer)",
    translationEn: "Brother (of woman)",
    context: "Usado por mujeres para referirse a sus hermanos",
    pronunciation: "TOO-ree",
    category: "familia"
  },
  {
    term: "Abuelo",
    translationEs: "Abuelo",
    translationEn: "Grandfather",
    context: "Awki en algunas variantes del quechua cusqueño",
    pronunciation: "AW-kee",
    category: "familia"
  },

  // COMIDA
  {
    term: "Papa",
    translationEs: "Papa/Patata",
    translationEn: "Potato",
    context: "Alimento sagrado originario de los Andes",
    pronunciation: "PAH-pah",
    category: "comida"
  },
  {
    term: "Sara",
    translationEs: "Maíz",
    translationEn: "Corn",
    context: "Cereal sagrado en la cosmovisión andina",
    pronunciation: "SAH-rah",
    category: "comida"
  },
  {
    term: "Chuño",
    translationEs: "Papa deshidratada",
    translationEn: "Freeze-dried potato",
    context: "Técnica ancestral de conservación de papa",
    pronunciation: "CHOO-nyoh",
    category: "comida"
  },
  {
    term: "Quinua",
    translationEs: "Quinua",
    translationEn: "Quinoa",
    context: "Grano andino considerado alimento de los dioses",
    pronunciation: "kee-NOO-ah",
    category: "comida"
  },
  {
    term: "Chicha",
    translationEs: "Bebida de maíz fermentado",
    translationEn: "Fermented corn drink",
    context: "Bebida ceremonial importante en rituales andinos",
    pronunciation: "CHEE-chah",
    category: "comida"
  },
  {
    term: "Muyu",
    translationEs: "Semilla",
    translationEn: "Seed",
    context: "Representa fertilidad y continuidad en la cultura andina",
    pronunciation: "MOO-yoo",
    category: "comida"
  },

  // LUGARES Y NATURALEZA
  {
    term: "Qhapaq Ñan",
    translationEs: "Camino del Inca",
    translationEn: "Inca Trail",
    context: "Red de caminos del Imperio Incaico",
    pronunciation: "KHAH-pahk NYAHN",
    category: "lugares"
  },
  {
    term: "Apu",
    translationEs: "Montaña sagrada/Espíritu de la montaña",
    translationEn: "Sacred mountain/Mountain spirit",
    context: "Deidades tutelares de los cerros en la cosmovisión andina",
    pronunciation: "AH-poo",
    category: "lugares"
  },
  {
    term: "Pachamama",
    translationEs: "Madre Tierra",
    translationEn: "Mother Earth",
    context: "Deidad femenina de la tierra y fertilidad",
    pronunciation: "pah-chah-MAH-mah",
    category: "lugares"
  },
  {
    term: "Urqu",
    translationEs: "Cerro/Montaña",
    translationEn: "Hill/Mountain",
    context: "Elemento geográfico sagrado en los Andes",
    pronunciation: "OOR-koo",
    category: "lugares"
  },
  {
    term: "Qoccha",
    translationEs: "Lago/Laguna",
    translationEn: "Lake/Lagoon",
    context: "Cuerpos de agua considerados sagrados",
    pronunciation: "KOKE-chah",
    category: "lugares"
  },
  {
    term: "Mayu",
    translationEs: "Río",
    translationEn: "River",
    context: "Fuentes de agua vital en la geografía andina",
    pronunciation: "MAH-yoo",
    category: "lugares"
  },

  // CULTURA Y CEREMONIAS
  {
    term: "Inti Raymi",
    translationEs: "Fiesta del Sol",
    translationEn: "Festival of the Sun",
    context: "Ceremonia principal del solsticio de invierno en Cusco",
    pronunciation: "een-tee RAY-mee",
    category: "ceremonias"
  },
  {
    term: "Ayni",
    translationEs: "Reciprocidad/Trabajo comunitario",
    translationEn: "Reciprocity/Community work",
    context: "Principio fundamental de cooperación andina",
    pronunciation: "AY-nee",
    category: "cultura"
  },
  {
    term: "Minka",
    translationEs: "Trabajo colectivo",
    translationEn: "Collective work",
    context: "Sistema de trabajo comunitario para el bien común",
    pronunciation: "MEEN-kah",
    category: "cultura"
  },
  {
    term: "Chakana",
    translationEs: "Cruz andina",
    translationEn: "Andean cross",
    context: "Símbolo sagrado de la cosmovisión andina",
    pronunciation: "chah-KAH-nah",
    category: "cultura"
  },
  {
    term: "Despacho",
    translationEs: "Ofrenda a la Pachamama",
    translationEn: "Offering to Pachamama",
    context: "Ceremonia de reciprocidad con la Madre Tierra",
    pronunciation: "des-PAH-choh",
    category: "ceremonias"
  },

  // NÚMEROS
  {
    term: "Huk",
    translationEs: "Uno",
    translationEn: "One",
    context: "Número cardinal básico",
    pronunciation: "hook",
    category: "numeros"
  },
  {
    term: "Iskay",
    translationEs: "Dos",
    translationEn: "Two",
    context: "Representa dualidad en la cosmovisión andina",
    pronunciation: "ees-KAY",
    category: "numeros"
  },
  {
    term: "Kimsa",
    translationEs: "Tres",
    translationEn: "Three",
    context: "Número sagrado en la tradición andina",
    pronunciation: "KEEM-sah",
    category: "numeros"
  },
  {
    term: "Tawa",
    translationEs: "Cuatro",
    translationEn: "Four",
    context: "Representa los cuatro suyos del Tahuantinsuyo",
    pronunciation: "TAH-wah",
    category: "numeros"
  },
  {
    term: "Pichqa",
    translationEs: "Cinco",
    translationEn: "Five",
    context: "Número relacionado con los dedos de la mano",
    pronunciation: "PEECH-kah",
    category: "numeros"
  },

  // ANIMALES
  {
    term: "Llama",
    translationEs: "Llama",
    translationEn: "Llama",
    context: "Animal sagrado de carga en los Andes",
    pronunciation: "LYAH-mah",
    category: "animales"
  },
  {
    term: "Alpaca",
    translationEs: "Alpaca",
    translationEn: "Alpaca",
    context: "Camélido andino valorado por su fibra",
    pronunciation: "ahl-PAH-kah",
    category: "animales"
  },
  {
    term: "Vicuña",
    translationEs: "Vicuña",
    translationEn: "Vicuña",
    context: "Camélido salvaje con la fibra más fina del mundo",
    pronunciation: "vee-KOO-nyah",
    category: "animales"
  },
  {
    term: "Kuntur",
    translationEs: "Cóndor",
    translationEn: "Condor",
    context: "Ave sagrada que representa el mundo de arriba (Hanaq Pacha)",
    pronunciation: "KOON-toor",
    category: "animales"
  },
  {
    term: "Puma",
    translationEs: "Puma",
    translationEn: "Puma",
    context: "Felino que representa el mundo terrenal (Kay Pacha)",
    pronunciation: "POO-mah",
    category: "animales"
  },

  // TIEMPO Y CALENDARIO
  {
    term: "Inti",
    translationEs: "Sol",
    translationEn: "Sun",
    context: "Deidad principal del panteón inca",
    pronunciation: "een-tee",
    category: "tiempo"
  },
  {
    term: "Killa",
    translationEs: "Luna/Mes",
    translationEn: "Moon/Month",
    context: "Deidad femenina del tiempo lunar",
    pronunciation: "KEE-lyah",
    category: "tiempo"
  },
  {
    term: "Punchaw",
    translationEs: "Día",
    translationEn: "Day",
    context: "Unidad básica de tiempo",
    pronunciation: "POON-chaw",
    category: "tiempo"
  },
  {
    term: "Tuta",
    translationEs: "Noche",
    translationEn: "Night",
    context: "Período de descanso y sueños",
    pronunciation: "TOO-tah",
    category: "tiempo"
  },

  // COLORES
  {
    term: "Yurac",
    translationEs: "Blanco",
    translationEn: "White",
    context: "Color asociado a pureza y paz",
    pronunciation: "YOO-rahk",
    category: "colores"
  },
  {
    term: "Yana",
    translationEs: "Negro",
    translationEn: "Black",
    context: "Color del mundo de abajo en la cosmovisión andina",
    pronunciation: "YAH-nah",
    category: "colores"
  },
  {
    term: "Puka",
    translationEs: "Rojo",
    translationEn: "Red",
    context: "Color del poder y la vitalidad",
    pronunciation: "POO-kah",
    category: "colores"
  },
  {
    term: "Q'umir",
    translationEs: "Verde",
    translationEn: "Green",
    context: "Color de la naturaleza y crecimiento",
    pronunciation: "koo-MEER",
    category: "colores"
  },

  // TÉRMINOS BÁSICOS ÚTILES PARA TURISTAS
  {
    term: "Maypim",
    translationEs: "¿Dónde está?",
    translationEn: "Where is?",
    context: "Pregunta básica para ubicación",
    pronunciation: "may-PEEM",
    category: "basico"
  },
  {
    term: "Hayk'aq",
    translationEs: "¿Cuándo?",
    translationEn: "When?",
    context: "Pregunta por tiempo",
    pronunciation: "hay-KAHK",
    category: "basico"
  },
  {
    term: "Ima",
    translationEs: "¿Qué?",
    translationEn: "What?",
    context: "Pregunta básica de identificación",
    pronunciation: "ee-MAH",
    category: "basico"
  },
  {
    term: "Añay",
    translationEs: "¡Qué bonito!",
    translationEn: "How beautiful!",
    context: "Expresión de admiración común en turismo",
    pronunciation: "ah-NYAY",
    category: "basico"
  },
  {
    term: "Yanapaway",
    translationEs: "Ayúdame",
    translationEn: "Help me",
    context: "Petición de ayuda para turistas",
    pronunciation: "yah-nah-pah-WAY",
    category: "basico"
  }
];

const seedContent = async () => {
  try {
    // Limpiar colección existente
    await Content.deleteMany({});
    
    // Insertar nuevo contenido
    const content = await Content.insertMany(contentData);
    console.log(`✅ ${content.length} términos culturales insertados correctamente`);
    return content;
  } catch (error) {
    console.error('❌ Error al sembrar contenido:', error.message);
    throw error;
  }
};

module.exports = { seedContent };