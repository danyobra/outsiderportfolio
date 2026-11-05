// Tiny local static server for the portfolio. No dependencies, just Node.
//   node serve.js            -> http://localhost:8080
//   node serve.js 3000       -> http://localhost:3000
// Supports HTTP Range requests, which browsers need to play/seek the demo videos.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.ktx2': 'image/ktx2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');

    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes' };
    const range = req.headers.range;

    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] !== '' ? parseInt(m[1], 10) : 0;
      let end = m && m[2] !== '' ? parseInt(m[2], 10) : st.size - 1;
      if (m && m[1] === '' && m[2] !== '') { start = Math.max(0, st.size - parseInt(m[2], 10)); end = st.size - 1; }
      if (!m || start > end || start >= st.size) {
        return send(res, 416, '', { 'Content-Range': `bytes */${st.size}` });
      }
      end = Math.min(end, st.size - 1);
      res.writeHead(206, {
        ...base,
        'Cache-Control': 'no-store',
        'Content-Range': `bytes ${start}-${end}/${st.size}`,
        'Content-Length': end - start + 1,
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }

    res.writeHead(200, { ...base, 'Cache-Control': 'no-store', 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

http
  .createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return send(res, 400, 'Bad request');
    }

    // Stay inside the project folder.
    let file = path.normalize(path.join(ROOT, pathname));
    if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden');

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

    // Unknown routes without a file extension (e.g. /music) fall back to the app shell.
    if (!fs.existsSync(file) && !path.extname(pathname)) file = path.join(ROOT, 'index.html');

    serveFile(req, res, file);
  })
  .listen(PORT, () => {
    console.log(`\n  Portfolio running at  http://localhost:${PORT}`);
    console.log(`  Static 2D view:       http://localhost:${PORT}/?static=1`);
    console.log('  Press Ctrl+C to stop.\n');
  });
