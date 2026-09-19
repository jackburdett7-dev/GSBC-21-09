// Local preview of the concept site. Nothing is deployed.
// Double-click _preview/preview.cmd, or run:  node _preview/serve.mjs   ->  http://localhost:4520/
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.env.PORT || 4520);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf', '.md': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return fs.createReadStream(f).pipe(res);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found');
}).listen(port, '127.0.0.1', () => console.log('GBSC concept: http://localhost:' + port + '/'));
