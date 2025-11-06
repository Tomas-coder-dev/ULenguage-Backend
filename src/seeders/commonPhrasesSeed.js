'use strict';
/**
 * src/seeders/commonPhrasesSeed.js
 * 
 * Seeder para frases comunes/útiles en español, inglés y quechua cusqueño
 * Agrupadas por categorías relevantes para turistas en Cusco
 */

const CommonPhrase = require('../models/CommonPhrase');

const commonPhrasesData = [
  {
    category: 'saludos',
    icon: 'person_2_fill',
    color: '#DA2C38',
    order: 1,
    phrases: [
      {
        spanish: 'Hola',
        english: 'Hello',
        quechua: 'Napaykuy',
        pronunciation: 'na-pai-kui'
      },
      {
        spanish: 'Buenos días',
        english: 'Good morning',
        quechua: 'Allin punchaw',
        pronunciation: 'a-llin pun-chaw'
      },
      {
        spanish: '¿Cómo estás?',
        english: 'How are you?',
        quechua: 'Imaynallan kashanki?',
        pronunciation: 'i-mai-na-llan ka-shan-ki'
      },
      {
        spanish: 'Estoy bien',
        english: 'I am fine',
        quechua: 'Allillanmi',
        pronunciation: 'a-lli-llan-mi'
      },
      {
        spanish: 'Gracias',
        english: 'Thank you',
        quechua: 'Sulpayki',
        pronunciation: 'sul-pai-ki'
      },
      {
        spanish: 'De nada',
        english: 'You\'re welcome',
        quechua: 'Imamantataq',
        pronunciation: 'i-ma-man-ta-taq'
      },
      {
        spanish: 'Por favor',
        english: 'Please',
        quechua: 'Allichu',
        pronunciation: 'a-lli-chu'
      },
      {
        spanish: 'Disculpa',
        english: 'Excuse me',
        quechua: 'Pampachaway',
        pronunciation: 'pam-pa-cha-wai'
      },
      {
        spanish: 'Adiós',
        english: 'Goodbye',
        quechua: 'Tupananchiskama',
        pronunciation: 'tu-pa-nan-chis-ka-ma'
      },
      {
        spanish: 'Hasta mañana',
        english: 'See you tomorrow',
        quechua: 'Paqarin kama',
        pronunciation: 'pa-qa-rin ka-ma'
      },
      {
        spanish: '¿Cuál es tu nombre?',
        english: 'What is your name?',
        quechua: 'Iman sutiyki?',
        pronunciation: 'i-man su-tii-ki'
      },
      {
        spanish: 'Mi nombre es...',
        english: 'My name is...',
        quechua: 'Sutiyqa...',
        pronunciation: 'su-tii-qa'
      }
    ]
  },
  {
    category: 'navegacion',
    icon: 'location_solid',
    color: '#2A9D8F',
    order: 2,
    phrases: [
      {
        spanish: '¿Dónde está...?',
        english: 'Where is...?',
        quechua: 'Maypin...?',
        pronunciation: 'mai-pin'
      },
      {
        spanish: '¿Cómo llego a...?',
        english: 'How do I get to...?',
        quechua: 'Imaynatan chayasaq...?',
        pronunciation: 'i-mai-na-tan cha-ya-saq'
      },
      {
        spanish: '¿Dónde está el baño?',
        english: 'Where is the bathroom?',
        quechua: 'Maypin baño kachkan?',
        pronunciation: 'mai-pin ba-ño ka-ch-kan'
      },
      {
        spanish: 'Estoy perdido',
        english: 'I am lost',
        quechua: 'Chinkasqa kani',
        pronunciation: 'chin-kas-qa ka-ni'
      },
      {
        spanish: 'A la izquierda',
        english: 'To the left',
        quechua: 'Lluq\'iman',
        pronunciation: 'lluq-i-man'
      },
      {
        spanish: 'A la derecha',
        english: 'To the right',
        quechua: 'Pañaman',
        pronunciation: 'pa-ña-man'
      },
      {
        spanish: 'Todo recto',
        english: 'Straight ahead',
        quechua: 'Chiqanman',
        pronunciation: 'chi-qan-man'
      },
      {
        spanish: 'Cerca',
        english: 'Near',
        quechua: 'Qaylla',
        pronunciation: 'qai-lla'
      },
      {
        spanish: 'Lejos',
        english: 'Far',
        quechua: 'Karu',
        pronunciation: 'ka-ru'
      }
    ]
  },
  {
    category: 'compras',
    icon: 'cart_fill',
    color: '#E76F51',
    order: 3,
    phrases: [
      {
        spanish: '¿Cuánto cuesta?',
        english: 'How much is it?',
        quechua: 'Hayk\'an chanin?',
        pronunciation: 'haik-an cha-nin'
      },
      {
        spanish: 'Es muy caro',
        english: 'It\'s very expensive',
        quechua: 'Ancha chaniyuqmi',
        pronunciation: 'an-cha cha-ni-yuq-mi'
      },
      {
        spanish: '¿Puedes dar más barato?',
        english: 'Can you give a discount?',
        quechua: 'Pisiyachiwankimanchu?',
        pronunciation: 'pi-si-ya-chi-wan-ki-man-chu'
      },
      {
        spanish: 'Voy a comprar esto',
        english: 'I will buy this',
        quechua: 'Kayta rantisaq',
        pronunciation: 'kai-ta ran-ti-saq'
      },
      {
        spanish: 'No quiero, gracias',
        english: 'I don\'t want it, thank you',
        quechua: 'Manan munanichu, sulpayki',
        pronunciation: 'ma-nan mu-na-ni-chu sul-pai-ki'
      },
      {
        spanish: '¿Aceptan tarjeta?',
        english: 'Do you accept card?',
        quechua: 'Tarjetawan paganki?',
        pronunciation: 'tar-je-ta-wan pa-gan-ki'
      },
      {
        spanish: '¿Tienes cambio?',
        english: 'Do you have change?',
        quechua: 'Qolqe cambioykichu?',
        pronunciation: 'qol-qe kam-bio-iki-chu'
      }
    ]
  },
  {
    category: 'restaurante',
    icon: 'house_fill',
    color: '#F4A261',
    order: 4,
    phrases: [
      {
        spanish: 'Tengo hambre',
        english: 'I am hungry',
        quechua: 'Yarqasqami kani',
        pronunciation: 'yar-qas-qa-mi ka-ni'
      },
      {
        spanish: 'Tengo sed',
        english: 'I am thirsty',
        quechua: 'Ch\'akisqami kani',
        pronunciation: 'cha-kis-qa-mi ka-ni'
      },
      {
        spanish: 'La cuenta, por favor',
        english: 'The bill, please',
        quechua: 'Qolqeytachu',
        pronunciation: 'qol-qei-ta-chu'
      },
      {
        spanish: '¿Qué me recomiendas?',
        english: 'What do you recommend?',
        quechua: 'Imatataq yuyaychawarqanki?',
        pronunciation: 'i-ma-ta-taq yu-yai-cha-war-qan-ki'
      },
      {
        spanish: 'Está delicioso',
        english: 'It\'s delicious',
        quechua: 'Ancha sumaqmi',
        pronunciation: 'an-cha su-maq-mi'
      },
      {
        spanish: 'Agua, por favor',
        english: 'Water, please',
        quechua: 'Yaku allichu',
        pronunciation: 'ya-ku a-lli-chu'
      },
      {
        spanish: 'Sin picante',
        english: 'Not spicy',
        quechua: 'Mana uchuyuq',
        pronunciation: 'ma-na u-chu-yuq'
      }
    ]
  },
  {
    category: 'emergencias',
    icon: 'exclamationmark_triangle_fill',
    color: '#D62828',
    order: 5,
    phrases: [
      {
        spanish: '¡Ayuda!',
        english: 'Help!',
        quechua: 'Yanapaway!',
        pronunciation: 'ya-na-pa-wai'
      },
      {
        spanish: 'Necesito un doctor',
        english: 'I need a doctor',
        quechua: 'Hampi yachaqta munani',
        pronunciation: 'ham-pi ya-chaq-ta mu-na-ni'
      },
      {
        spanish: 'Llamen a la policía',
        english: 'Call the police',
        quechua: 'Policía waqyaychik',
        pronunciation: 'po-li-si-a waq-yai-chik'
      },
      {
        spanish: 'Estoy enfermo',
        english: 'I am sick',
        quechua: 'Onqosqami kani',
        pronunciation: 'on-qos-qa-mi ka-ni'
      },
      {
        spanish: 'Me perdí',
        english: 'I got lost',
        quechua: 'Chinkasqa karqani',
        pronunciation: 'chin-kas-qa kar-qa-ni'
      },
      {
        spanish: '¿Dónde está el hospital?',
        english: 'Where is the hospital?',
        quechua: 'Maypin hospital kachkan?',
        pronunciation: 'mai-pin os-pi-tal ka-ch-kan'
      }
    ]
  },
  {
    category: 'numeros',
    icon: 'number',
    color: '#264653',
    order: 6,
    phrases: [
      {
        spanish: 'Uno',
        english: 'One',
        quechua: 'Huk',
        pronunciation: 'huk'
      },
      {
        spanish: 'Dos',
        english: 'Two',
        quechua: 'Iskay',
        pronunciation: 'is-kai'
      },
      {
        spanish: 'Tres',
        english: 'Three',
        quechua: 'Kinsa',
        pronunciation: 'kin-sa'
      },
      {
        spanish: 'Cuatro',
        english: 'Four',
        quechua: 'Tawa',
        pronunciation: 'ta-wa'
      },
      {
        spanish: 'Cinco',
        english: 'Five',
        quechua: 'Pichqa',
        pronunciation: 'pich-qa'
      },
      {
        spanish: 'Seis',
        english: 'Six',
        quechua: 'Soqta',
        pronunciation: 'soq-ta'
      },
      {
        spanish: 'Siete',
        english: 'Seven',
        quechua: 'Qanchis',
        pronunciation: 'qan-chis'
      },
      {
        spanish: 'Ocho',
        english: 'Eight',
        quechua: 'Pusaq',
        pronunciation: 'pu-saq'
      },
      {
        spanish: 'Nueve',
        english: 'Nine',
        quechua: 'Isqon',
        pronunciation: 'is-qon'
      },
      {
        spanish: 'Diez',
        english: 'Ten',
        quechua: 'Chunka',
        pronunciation: 'chun-ka'
      }
    ]
  },
  {
    category: 'turismo',
    icon: 'camera_fill',
    color: '#8338EC',
    order: 7,
    phrases: [
      {
        spanish: '¿Puedo tomar una foto?',
        english: 'Can I take a photo?',
        quechua: 'Fotota churanayman?',
        pronunciation: 'fo-to-ta chu-ra-nai-man'
      },
      {
        spanish: 'Es muy hermoso',
        english: 'It\'s very beautiful',
        quechua: 'Ancha sumaqmi',
        pronunciation: 'an-cha su-maq-mi'
      },
      {
        spanish: '¿A qué hora abre?',
        english: 'What time does it open?',
        quechua: 'Ima horapi kichakun?',
        pronunciation: 'i-ma o-ra-pi ki-cha-kun'
      },
      {
        spanish: '¿Cuánto cuesta la entrada?',
        english: 'How much is the entrance?',
        quechua: 'Hayk\'anmi yaykuna?',
        pronunciation: 'haik-an-mi yai-ku-na'
      },
      {
        spanish: 'Quiero ir a Machu Picchu',
        english: 'I want to go to Machu Picchu',
        quechua: 'Machu Picchuman rinaymi munani',
        pronunciation: 'ma-chu pi-chu-man ri-nai-mi mu-na-ni'
      },
      {
        spanish: '¿Dónde puedo comprar boletos?',
        english: 'Where can I buy tickets?',
        quechua: 'Maypin boletota rantiman?',
        pronunciation: 'mai-pin bo-le-to-ta ran-ti-man'
      }
    ]
  },
  {
    category: 'tiempo',
    icon: 'clock_fill',
    color: '#06A77D',
    order: 8,
    phrases: [
      {
        spanish: 'Hoy',
        english: 'Today',
        quechua: 'Kunan p\'unchaw',
        pronunciation: 'ku-nan p-un-chaw'
      },
      {
        spanish: 'Mañana',
        english: 'Tomorrow',
        quechua: 'Paqarin',
        pronunciation: 'pa-qa-rin'
      },
      {
        spanish: 'Ayer',
        english: 'Yesterday',
        quechua: 'Qayna',
        pronunciation: 'qai-na'
      },
      {
        spanish: 'Ahora',
        english: 'Now',
        quechua: 'Kunan',
        pronunciation: 'ku-nan'
      },
      {
        spanish: 'Después',
        english: 'Later',
        quechua: 'Qhipaman',
        pronunciation: 'qhi-pa-man'
      },
      {
        spanish: '¿Qué hora es?',
        english: 'What time is it?',
        quechua: 'Ima hora?',
        pronunciation: 'i-ma o-ra'
      }
    ]
  }
];

async function seedCommonPhrases() {
  try {
    console.log('🌱 Iniciando seed de frases comunes...');
    
    // Verificar si ya existen frases
    const count = await CommonPhrase.countDocuments();
    if (count > 0) {
      console.log(`✓ Ya existen ${count} categorías de frases comunes. Saltando seed.`);
      return;
    }
    
    // Insertar frases comunes
    const inserted = await CommonPhrase.insertMany(commonPhrasesData);
    
    console.log(`✅ ${inserted.length} categorías de frases comunes insertadas exitosamente`);
    
    // Mostrar resumen
    let totalPhrases = 0;
    inserted.forEach(cat => {
      totalPhrases += cat.phrases.length;
      console.log(`   - ${cat.category}: ${cat.phrases.length} frases`);
    });
    console.log(`📊 Total: ${totalPhrases} frases en ${inserted.length} categorías`);
    
  } catch (error) {
    console.error('❌ Error en seed de frases comunes:', error.message);
    throw error;
  }
}

module.exports = seedCommonPhrases;
