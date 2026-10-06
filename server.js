// Локальный сервер без зависимостей: HTTP всегда, HTTPS если переданы сертификаты.
//   node server.js                      -> HTTP на порту 8000
//   node server.js cert.pem key.pem     -> дополнительно HTTPS на порту 8443
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os');

const PORT = +process.env.PORT || 8000;
const SPORT = +process.env.SPORT || 8443;
const [, , certPath, keyPath] = process.argv;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function handler(req, res) {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(__dirname, url === '/' ? 'index.html' : url);
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

const lan = () => Object.values(os.networkInterfaces()).flat()
  .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);

function show(proto, port) {
  console.log(proto.toUpperCase() + ':');
  console.log('  на этом компьютере: ' + proto + '://localhost:' + port);
  lan().forEach(a => console.log('  с телефона (та же Wi-Fi): ' + proto + '://' + a + ':' + port));
}

http.createServer(handler).listen(PORT, '0.0.0.0', () => show('http', PORT));

if (certPath && keyPath) {
  const opts = { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  https.createServer(opts, handler).listen(SPORT, '0.0.0.0', () => show('https', SPORT));
}
