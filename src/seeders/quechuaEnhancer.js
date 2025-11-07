'use strict';
/**
 * src/seeders/quechuaEnhancer.js
 * 
 * Mejora las entradas existentes del diccionario Quechua con:
 * - variants (ortografías alternativas)
 * - source ('seeder')
 * - frequency (basado en categoría: frases comunes = mayor frecuencia)
 */

const QuechuaCusqueno = require('../models/QuechuaCusqueno');

// Mapa de variantes comunes para palabras frecuentes
const variantsMap = {
  'hola (formal)': ['hola', 'ola'],
  '¿cómo estás?': ['como estas', 'como esta'],
  'gracias': ['grax', 'gracia', 'grasias'],
  'te pago / gracias': ['gracias', 'pago'],
  'de nada': ['denada'],
  'sí': ['si'],
  'adiós (hasta que nos encontremos)': ['adios', 'chau'],
  'hasta mañana': ['hasta manana'],
  '¿está bien? / ¿por favor?': ['esta bien', 'por favor'],
  '¿cuál es tu nombre?': ['cual es tu nombre', 'tu nombre'],
  'mi nombre es...': ['mi nombre es', 'me llamo'],
  '¿dónde?': ['donde'],
  '¿cuándo?': ['cuando'],
  '¿por qué?': ['por que', 'porque'],
  '¿cuánto?': ['cuanto'],
  '¿cómo?': ['como'],
  'perdóname': ['perdoname', 'disculpa'],
  // Lugares comunes
  'casa': ['kasa'],
  'agua': ['h2o'],
  'comida': ['komida'],
  'camino': ['calle', 'ruta'],
  'montaña': ['montana', 'cerro'],
  'río': ['rio'],
  'sol': ['☀️'],
  'luna': ['🌙'],
  'maíz': ['maiz', 'choclo'],
  'papa': ['patata'],
  'perro': ['can'],
  'gato': ['michi'],
  'llama': ['🦙'],
  'alpaca': ['🦙'],
  'cóndor': ['condor'],
  'día': ['dia'],
  'año': ['anio'],
  'niño/a, bebé, hijo/a': ['niño', 'nina', 'bebe', 'hijo', 'hija'],
  'madre': ['mamá', 'mama'],
  'padre': ['papá', 'papa', 'tata']
};

// Asignar frequency basado en categoría
const frequencyByCategory = {
  'Saludos y Frases Comunes': 100,
  'Personas y Familia': 80,
  'Cuerpo Humano': 40,
  'Naturaleza y Geografía': 60,
  'Animales': 50,
  'Plantas y Agricultura': 45,
  'Comida y Bebida': 70,
  'Vestimenta y Objetos': 35,
  'Colores': 55,
  'Números': 85,
  'Tiempo (cronológico)': 65,
  'Clima y Fenómenos Naturales': 30,
  'Acciones y Verbos': 75,
  'Adjetivos y Estados': 50,
  'Lugares y Construcciones': 55,
  'Conceptos Abstractos': 25,
  'Cultura y Espiritualidad': 40
};

async function enhanceQuechuaEntries() {
  try {
    console.log('🔧 Iniciando mejora de entradas Quechua existentes...');
    
    const entries = await QuechuaCusqueno.find({});
    console.log(`📊 Encontradas ${entries.length} entradas para mejorar`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const entry of entries) {
      try {
        const updates = {};
        let needsUpdate = false;
        
        // 1. Agregar source si no existe
        if (!entry.source) {
          updates.source = 'seeder';
          needsUpdate = true;
        }
        
        // 2. Agregar frequency basada en categoría
        if (entry.frequency === 0 || !entry.frequency) {
          const baseFrequency = frequencyByCategory[entry.category] || 10;
          // Agregar variabilidad aleatoria ±20%
          const variance = Math.floor(baseFrequency * 0.2 * Math.random());
          updates.frequency = baseFrequency + variance;
          needsUpdate = true;
        }
        
        // 3. Agregar variants si la palabra tiene alternativas conocidas
        if (!entry.variants || entry.variants.length === 0) {
          const spanishLower = entry.spanish.toLowerCase();
          const knownVariants = variantsMap[spanishLower];
          
          if (knownVariants && knownVariants.length > 0) {
            updates.variants = knownVariants;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await QuechuaCusqueno.findByIdAndUpdate(entry._id, { $set: updates });
          updated++;
          
          if (updated % 50 === 0) {
            console.log(`   ... ${updated} entradas actualizadas`);
          }
        } else {
          skipped++;
        }
        
      } catch (err) {
        console.warn(`⚠️  Error actualizando entrada ${entry.spanish}:`, err.message);
      }
    }
    
    console.log(`✅ Mejora completada:`);
    console.log(`   - ${updated} entradas actualizadas`);
    console.log(`   - ${skipped} entradas ya estaban completas`);
    
    // Estadísticas finales
    const stats = await QuechuaCusqueno.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          avgFrequency: { $avg: '$frequency' },
          entriesWithVariants: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ['$variants', []] } }, 0] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    if (stats.length > 0) {
      console.log(`\n📈 Estadísticas del diccionario:`);
      console.log(`   - Total entradas: ${stats[0].totalEntries}`);
      console.log(`   - Frecuencia promedio: ${stats[0].avgFrequency.toFixed(1)}`);
      console.log(`   - Entradas con variantes: ${stats[0].entriesWithVariants}`);
    }
    
  } catch (error) {
    console.error('❌ Error mejorando entradas Quechua:', error.message);
    throw error;
  }
}

module.exports = enhanceQuechuaEntries;

// Ejecutable directamente
if (require.main === module) {
  const connectDB = require('../config/db');
  
  connectDB()
    .then(() => enhanceQuechuaEntries())
    .then(() => {
      console.log('✓ Proceso completado');
      process.exit(0);
    })
    .catch(err => {
      console.error('✗ Error:', err);
      process.exit(1);
    });
}
