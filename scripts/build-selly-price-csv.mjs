import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook } from '@oai/artifact-tool';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'qa', 'selly-prices.json');
const outputDir = path.join(root, 'data');
const outputPath = path.join(outputDir, 'ceny-wariantow-brutto-selly.csv');

const sources = {
  '6350': 'https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=6350',
  '6346': 'https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=6346',
  '7716': 'https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=7716',
  '9290': 'https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=9290',
  '9291': 'https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=9291'
};

function fields(text) {
  return Object.fromEntries(text.split('. ').map(part => {
    const at = part.indexOf(':');
    return at < 0 ? null : [part.slice(0, at).trim(), part.slice(at + 1).trim()];
  }).filter(Boolean));
}

function range(value) {
  const match = String(value || '').match(/(\d+)\s*[-–]\s*(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] : ['', ''];
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const products = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const rows = [];
for (const product of products) {
  for (const variant of product.rows) {
    const f = fields(variant.attributes);
    const [widthFrom, widthTo] = range(f['Szerokość korpusu szafki']);
    const [heightFrom, heightTo] = range(f['Wysokość korpusu szafki']);
    const minDepth = Number.parseInt(f['Minimalna głębokość korpusu szafki'], 10);
    rows.push([
      Number(product.productId), product.productName, Number(variant.variantId), variant.position,
      widthFrom, widthTo, heightFrom, heightTo, Number.isFinite(minDepth) ? minDepth : '',
      f['Kolor rolety meblowej'] || '', Number(variant.gross), sources[product.productId]
    ]);
  }
}

const header = ['produkt_id', 'produkt', 'wariant_id', 'pozycja', 'szerokosc_od_mm', 'szerokosc_do_mm', 'wysokosc_od_mm', 'wysokosc_do_mm', 'minimalna_glebokosc_mm', 'wykonczenie', 'cena_brutto_pln', 'zrodlo_selly'];
const csv = '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';

// Parse the final CSV with artifact-tool before saving it as the requested artifact.
const workbook = await Workbook.fromCSV(csv, { sheetName: 'Ceny brutto' });
const sheet = workbook.worksheets.getItem('Ceny brutto');
const used = sheet.getUsedRange(true);
if (!used || rows.length !== 370 || rows.some(row => !Number.isFinite(row[10]))) {
  throw new Error('Niekompletne dane cenowe Selly.');
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, csv, 'utf8');
console.log(JSON.stringify({ outputPath, rowCount: rows.length, products: products.map(p => ({ id: p.productId, rows: p.rows.length })) }));
