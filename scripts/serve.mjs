import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json' };
http.createServer(async (req,res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + sep) || !types[extname(path)]) { res.writeHead(404); res.end(); return; }
    const data = await readFile(path);
    res.writeHead(200, {'Content-Type':types[extname(path)], 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff'}); res.end(data);
  } catch { res.writeHead(404); res.end('Nie znaleziono strony.'); }
}).listen(4173, '127.0.0.1', () => console.log('INTAGO: http://127.0.0.1:4173'));
