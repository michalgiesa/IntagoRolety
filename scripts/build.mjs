import { mkdir, copyFile, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), {recursive:true});
for (const file of ['index.html','styles.css','app.js','systems-data.js']) await copyFile(resolve(root,file),resolve(root,'dist',file));
await cp(resolve(root,'src'),resolve(root,'dist/src'),{recursive:true});
await cp(resolve(root,'assets'),resolve(root,'dist/assets'),{recursive:true});
console.log('Gotowe: dist/ — statyczna aplikacja bez zewnętrznych zależności.');
