const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function preprocessForOcr(inputPath, opts = {}) {
  const width = opts.width || 1600;
  const quality = opts.quality || 85;
  const normalize = opts.normalize === undefined ? true : !!opts.normalize;

  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `preproc_${Date.now()}.jpg`);

  let pipeline = sharp(inputPath).rotate().resize({ width, fit: 'inside' }).jpeg({ quality });
  if (normalize) pipeline = pipeline.grayscale().normalize().sharpen();
  await pipeline.toFile(outPath);
  return outPath;
}

module.exports = { preprocessForOcr };