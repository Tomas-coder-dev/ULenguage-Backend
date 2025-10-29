const fs = require('fs');
const path = require('path');

const WORDLIST_DIR = path.join(__dirname, '../../wordlist'); // ajusta si hace falta
const QUECHUA_FILE = 'quechua_words.txt';
const EN_FILE = 'english_words.txt';

// Variables cacheadas en memoria (se actualizan si activas el watcher)
let QUECHUA_WORDS = [];
let ENGLISH_WORDS = [];

/** Lee y parsea sincrónicamente (puedes cambiar a async si lo prefieres) */
function loadWordListSync(filename) {
  try {
    const fullPath = path.join(WORDLIST_DIR, filename);
    const content = fs.readFileSync(fullPath, 'utf8');
    return content
      .split(/\r?\n/)
      .map(w => w.trim().toLowerCase())
      .filter(Boolean);
  } catch (err) {
    console.warn(`loadWordListSync: no se pudo leer ${filename}:`, err.message || err);
    return [];
  }
}

/** Opción B: getters que leen al vuelo (no usan cache) */
function getQuechuaWordsOnDemand() {
  return loadWordListSync(QUECHUA_FILE);
}
function getEnglishWordsOnDemand() {
  return loadWordListSync(EN_FILE);
}

/** Opción A: precarga y watcher que actualiza las variables en memoria */
function reloadAllCached() {
  QUECHUA_WORDS = loadWordListSync(QUECHUA_FILE);
  ENGLISH_WORDS = loadWordListSync(EN_FILE);
}

// Inicializar cache
reloadAllCached();

// Watcher: recarga automáticamente si los archivos cambian (útil en dev)
try {
  // fs.watchFile usa stat polling; ajusta el intervalo si lo deseas
  const watchOptions = { interval: 1000 };
  fs.watchFile(path.join(WORDLIST_DIR, QUECHUA_FILE), watchOptions, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      console.log('quechua_words.txt cambiado -> recargando cache');
      try { QUECHUA_WORDS = loadWordListSync(QUECHUA_FILE); } catch (e) {}
    }
  });
  fs.watchFile(path.join(WORDLIST_DIR, EN_FILE), watchOptions, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      console.log('english_words.txt cambiado -> recargando cache');
      try { ENGLISH_WORDS = loadWordListSync(EN_FILE); } catch (e) {}
    }
  });
} catch (e) {
  console.warn('No se pudo inicializar watcher de wordlist:', e.message || e);
}

/** Exporto ambas opciones: getters on-demand y acceso a la cache actual */
function getCachedQuechuaWords() {
  return QUECHUA_WORDS;
}
function getCachedEnglishWords() {
  return ENGLISH_WORDS;
}

/** Forzar recarga manual desde otro módulo si lo deseas */
function forceReload() {
  reloadAllCached();
}

module.exports = {
  // Opción A: usar cache + watcher (rápido accesos repetidos)
  getCachedQuechuaWords,
  getCachedEnglishWords,
  // Opción B: leer on-demand desde disco (si prefieres no tener watcher)
  getQuechuaWordsOnDemand,
  getEnglishWordsOnDemand,
  // Control
  forceReload
};