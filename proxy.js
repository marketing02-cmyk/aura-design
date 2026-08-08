// Mini-proxy local: libera CORS e repassa para a API kpalabz.
// Requisito: Node.js 18+ (https://nodejs.org)
// Rodar:  node proxy.js
// Depois, no app, use a URL:  http://localhost:8787
const http = require('http');
const TARGET = 'https://api.kpalabz.com'; // troque aqui se mudar de API
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') { res.end(); return; }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const r = await fetch(TARGET + req.url, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.headers['x-api-key'] || '',
          'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
        },
        body: body || undefined
      });
      const text = await r.text();
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(text);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e) }));
    }
  });
}).listen(8787, () => console.log('Proxy rodando em http://localhost:8787 -> ' + TARGET));
