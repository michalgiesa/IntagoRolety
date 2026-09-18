import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'client-package');
const htmlPath = resolve(output, 'INTAGO-Rolety-Demo.html');
const sourceFiles = [
  'systems-data.js',
  'src/engine.js',
  'src/state.js',
  'src/persistence.js',
  'src/quote.js',
  'src/geometry.js',
  'src/renderer.js',
  'src/wizard.js',
  'app.js'
];

// Integracja Selly (mapa wariantów, ceny live, koszyk i materiały) jest utrzymywana
// w osadzanym artefakcie. Zachowaj ją podczas przebudowy z modułowych źródeł.
const existingStandalone = await readFile(htmlPath, 'utf8');
const embeddedStart = existingStandalone.indexOf('/* pricing-data.js');
const embeddedEnd = existingStandalone.indexOf('/* src/engine.js */', embeddedStart);
if (embeddedStart < 0 || embeddedEnd < 0) {
  throw new Error('Nie znaleziono bloku integracji Selly w istniejącym pliku klienckim.');
}
const embeddedCommerce = existingStandalone.slice(embeddedStart, embeddedEnd).trim();

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const template = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'styles.css'), 'utf8');
const logo = await readFile(resolve(root, 'assets', 'intago-logo.png'));
const logoData = `data:image/png;base64,${logo.toString('base64')}`;
const favicon = await readFile(resolve(root, 'assets', 'intago-favicon.webp'));
const faviconData = `data:image/webp;base64,${favicon.toString('base64')}`;
const scripts = [];

for (const filename of sourceFiles) {
  let source = await readFile(resolve(root, filename), 'utf8');
  source = source.replace(/^\uFEFF/, '');
  source = source.replace(/^import\s+[^;]+;\s*$/gm, '');
  source = source.replace(/\bexport\s+(?=(const|let|var|function|class)\b)/g, '');
  scripts.push(`/* ${filename} */\n${source}`);
  if (filename === 'systems-data.js') scripts.push(embeddedCommerce);
}

// The standalone build shares one script scope, so validate it before packaging.
new Function(scripts.join('\n\n'));

const standalone = template
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('assets/intago-logo.png', () => logoData)
  .replace('assets/intago-favicon.webp', () => faviconData)
  .replace('<script type="module" src="app.js"></script>', '')
  .replace('</body>', () => `<script>\n${scripts.join('\n\n')}\n</script>\n</body>`);

await writeFile(htmlPath, standalone, 'utf8');
await cp(resolve(root, 'client', 'README.txt'), resolve(output, 'PRZECZYTAJ-MNIE.txt'));

const zipPath = resolve(root, 'INTAGO-Rolety-Demo-dla-klienta.zip');
await rm(zipPath, { force: true });
execFileSync('tar.exe', [
  '-a', '-c', '-f', zipPath,
  '-C', output,
  'INTAGO-Rolety-Demo.html',
  'PRZECZYTAJ-MNIE.txt'
], { stdio: 'inherit' });

console.log(`Gotowe: ${htmlPath}`);
console.log(`Gotowe: ${zipPath}`);
