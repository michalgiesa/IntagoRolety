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

const pricing = `const PRICE_VERSION='2026-09-15';
const PRICE_VARIANTS=${JSON.stringify(variants)};
const PRICE_SOURCES={"6350":"https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=6350","6346":"https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=6346","7716":"https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=7716","9290":"https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=9290","9291":"https://www.intago.com.pl/adm/?a=produkty.produktWarianty&produkt=9291"};
const priceFormat=new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',minimumFractionDigits:0,maximumFractionDigits:0});
function priceFor(state,productId=state.selectedProduct){
 if(!productId||!state.orientation)return null;
 const all=PRICE_VARIANTS.filter(v=>v[0]===productId&&v[1]===state.orientation);
 if(!all.length)return {mode:'quote',gross:null,label:'Cena po wycenie',note:'Brak wariantów cenowych Selly dla tej konfiguracji.',source:null};
 const w=Number(state.dimensions.width),h=Number(state.dimensions.height),d=Number(state.dimensions.depth),hasDims=Number.isFinite(w)&&Number.isFinite(h);
 let matches=hasDims?all.filter(v=>w>=Math.min(v[3],v[4])&&w<=Math.max(v[3],v[4])&&h>=Math.min(v[5],v[6])&&h<=Math.max(v[5],v[6])&&(!v[7]||Number.isFinite(d)&&d>=v[7])):all;
 if(state.finish)matches=matches.filter(v=>v[8]===state.finish);
 if(!matches.length)return {mode:'quote',gross:null,label:'Cena po wycenie',note:'Brak pasującego wariantu cenowego Selly dla tych wymiarów i wykończenia.',source:null};
 const prices=[...new Set(matches.map(v=>v[9]))],gross=Math.min(...prices),exact=hasDims&&(state.finish||prices.length===1);
 const productSource=String(matches[0][10]);
 return {mode:exact?'exact':'from',gross,label:(exact?'':'od ')+priceFormat.format(gross),variantId:exact&&matches.length===1?matches[0][2]:null,note:exact?'Cena brutto wariantu Selly dopasowanego do zakresu wymiarów i wykończenia.':'Najniższa cena brutto w pasujących wariantach Selly; dokładna cena zależy od wymiarów i wykończenia.',source:PRICE_SOURCES[productSource]};
}
function priceCardHtml(state,productId){
 const p=priceFor(state,productId);if(!p)return '';
 const caption=p.mode==='exact'?'Cena dla konfiguracji':p.mode==='from'?'Cena orientacyjna':'Cena';
 const badge=p.mode==='exact'?(p.variantId?'wariant '+p.variantId:'brutto / Selly'):p.mode==='from'?'brutto / od':'wycena indywidualna';
 return '<div class="rec-price '+p.mode+'"><span class="rec-price-text"><small>'+caption+'</small><strong>'+escape(p.label)+'</strong></span><span class="rec-price-badge">'+badge+'</span></div>';
}
function selectedPriceHtml(state){
 const p=priceFor(state);if(!p)return '';
 return '<div class="summary-price-note"><strong>'+escape(p.label)+'</strong><br>'+escape(p.note)+' <span class="muted">Cennik Selly: '+PRICE_VERSION+'.</span></div>';
}`;

let html = await fs.readFile(htmlPath, 'utf8');
const start = html.indexOf("const PRICE_VERSION='");
const end = html.indexOf('const componentImages=', start);
if (start < 0 || end < 0) throw new Error('Nie znaleziono istniejącego bloku cen w wersji klienckiej.');
html = html.slice(0, start) + pricing + '\n\n' + html.slice(end);

const favicon = await fs.readFile(path.join(root, 'assets', 'intago-favicon.webp'));
const faviconData = `data:image/webp;base64,${favicon.toString('base64')}`;
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/webp" href="${faviconData}">`);
await fs.writeFile(htmlPath, html, 'utf8');
console.log(JSON.stringify({ htmlPath, variants: variants.length, bytes: html.length }));
