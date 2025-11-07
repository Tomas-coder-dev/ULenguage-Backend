const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes Glosbe for translations between any supported language pair.
<<<<<<< HEAD
 * Returns an array of unique dictionary translations (not algorithmic/synonyms).
 */
async function scrapeGlosbe(from, to, text) {
  const url = `https://glosbe.com/${from}/${to}/${encodeURIComponent(text)}`;
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const results = [];

    // Encuentra solo los términos principales del diccionario
    $('.dict-entry__header__word').each((i, el) => {
      const word = $(el).text().trim();
      if (word && !results.includes(word)) results.push(word);
    });

    // Si no hay nada, busca alternativas menos frecuentes
    if (results.length === 0) {
      $('.dict-entry__header__word--uncommon').each((i, el) => {
        const word = $(el).text().trim();
        if (word && !results.includes(word)) results.push(word);
      });
    }

    // Si sigue vacío, busca traducciones generadas algorítmicamente
    if (results.length === 0) {
      $('.dict-algo__translation').each((i, el) => {
        const word = $(el).text().trim();
        if (word && !results.includes(word)) results.push(word);
      });
    }

    // Fallback: busca en spans con la clase .translation
    if (results.length === 0) {
      $('.translation').each((i, el) => {
        const word = $(el).text().trim();
        if (word && !results.includes(word)) results.push(word);
      });
    }

    // Devuelve todas las traducciones principales o solo la primera
    return results;
  } catch (err) {
    console.error('Error scraping Glosbe:', err.message);
    return [];
  }
=======
 * More robust: headers, timeout, retries, multiple selectors, normalization.
 * Returns array of unique candidate strings (may be empty).
 */
function normalizeText(s) {
  if (!s) return '';
  return s.toString().trim().replace(/\s+/g, ' ');
}

async function scrapeGlosbe(from, to, text, opts = {}) {
  const attempts = opts.attempts || 3;
  const timeout = opts.timeout || 8000;
  const query = encodeURIComponent(String(text || '').trim());
  const url = `https://glosbe.com/${from}/${to}/${query}`;

  const results = new Set();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const { data: html } = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ULenguageBot/1.0)',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      const $ = cheerio.load(html);

      // Primary selectors (current site structure)
      $('.dict-entry__header__word, .tu-translation__word, .dict-entry__word, .dict-entry__header__word--uncommon, .dict-algo__translation, .translation').each((i, el) => {
        const w = normalizeText($(el).text());
        if (w) results.add(w);
      });

      // Fallback: short text nodes, heuristic to reduce noise
      if (results.size === 0) {
        $('a, span, div').each((i, el) => {
          const txt = normalizeText($(el).text());
          if (!txt) return;
          if (txt.length > 0 && txt.length <= 60 && /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(txt)) {
            results.add(txt);
          }
        });
      }

      // If we collected candidates, break early
      if (results.size > 0) break;
    } catch (err) {
      // retry on transient errors
      if (attempt === attempts) {
        console.warn(`scrapeGlosbe: failed after ${attempt} attempts for ${from}->${to} "${text}":`, err.message);
      } else {
        await new Promise(r => setTimeout(r, 200 * attempt));
      }
    }
  }

  return Array.from(results);
>>>>>>> main
}

module.exports = { scrapeGlosbe };