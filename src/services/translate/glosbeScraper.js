const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes Glosbe for translations between any supported language pair.
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
}

module.exports = { scrapeGlosbe };