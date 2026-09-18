import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = JSON.parse(await fs.readFile(path.join(root, 'qa', 'selly-prices.json'), 'utf8'));
const htmlPath = path.join(root, 'client-package', 'INTAGO-Rolety-Demo.html');

const productMap = { '6350': 'top-basic-c3', '6346': 'top-basic', '7716': 'top-basic', '9290': 'noble-zewn', '9291': 'noble-wew' };
const orientationMap = { '7716': 'horizontal' };
const finishMap = {
  'Aluminium decor': 'silver', 'Biały RAL 9010': 'white',
  'Casa Blanca V3552': 'casa', 'Boxcar Blonde V3610': 'blonde', 'After Dark V3555': 'dark'
};

function fields(text) {
  return Object.fromEntries(text.split('. ').map(part => {
    const at = part.indexOf(':');
    return at < 0 ? null : [part.slice(0, at).trim(), part.slice(at + 1).trim()];
  }).filter(Boolean));
}
function range(value) {
  const match = String(value || '').match(/(\d+)\s*[-–]\s*(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] : [null, null];
}

const variants = source.flatMap(product => product.rows.map(row => {
  const f = fields(row.attributes);
  const [w0, w1] = range(f['Szerokość korpusu szafki']);
  const [h0, h1] = range(f['Wysokość korpusu szafki']);
  const depth = Number.parseInt(f['Minimalna głębokość korpusu szafki'], 10);
  return [productMap[product.productId], orientationMap[product.productId] || 'vertical', Number(row.variantId), w0, w1, h0, h1, Number.isFinite(depth) ? depth : 0, finishMap[f['Kolor rolety meblowej']], Number(row.gross), product.productId];
}));

// Aktualizujemy wyłącznie mapę konfiguracja -> productId/variantId.
// Ceny z kolumny gross są danymi synchronizacyjnymi i nie mogą zastąpić odczytu live z publicznej karty Selly.
const pricing = `const PRICE_VERSION='2026-09-15';
const PRICE_VARIANTS=${JSON.stringify(variants)};`;

let html = await fs.readFile(htmlPath, 'utf8');
const start = html.indexOf("const PRICE_VERSION='");
const end = html.indexOf('\nconst PRICE_SOURCES=', start);
if (start < 0 || end < 0) throw new Error('Nie znaleziono istniejącego bloku cen w wersji klienckiej.');
html = html.slice(0, start) + pricing + html.slice(end);

const favicon = await fs.readFile(path.join(root, 'assets', 'intago-favicon.webp'));
const faviconData = `data:image/webp;base64,${favicon.toString('base64')}`;
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/webp" href="${faviconData}">`);
await fs.writeFile(htmlPath, html, 'utf8');
console.log(JSON.stringify({ htmlPath, variants: variants.length, bytes: html.length }));
