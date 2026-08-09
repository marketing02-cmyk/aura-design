// Aura - Chat + Imagens + Design Studio
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHAT_API = 'https://api.kpalabz.com/v1/messages';
const CHAT_KEY = 'sk-kpa-5e547f13b6323da4fea5f15fa600db8ce1af20cdc45e3105c05288fe40870d95';
const CHAT_MODEL = 'claude-sonnet-4-20250514';
const OPENAI_KEY = 'sk-your-openai-key-here';

const server = http.createServer(function(req, res) {
  // Servir arquivos estáticos
  if (req.method === 'GET') {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, '..', filePath);

    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon'
    };

    fs.readFile(filePath, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, {'Content-Type': contentTypes[ext] || 'text/plain'});
      res.end(data);
    });
    return;
  }

  // API Chat
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
      res.writeHead(200, {'Content-Type': 'application/json'});
      try {
        var data = JSON.parse(body);
        var r = await fetch(CHAT_API, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'x-api-key': CHAT_KEY, 'anthropic-version': '2023-06-01'},
          body: JSON.stringify({model: CHAT_MODEL, max_tokens: 1024, messages: data.messages})
        });
        var text = await r.text();
        if (!r.ok) { res.end(JSON.stringify({error: 'HTTP ' + r.status})); return; }
        var d = JSON.parse(text);
        var reply = d.text || (d.content && d.content.find(function(c) { return c.type === 'text'; })) || '';
        if (typeof reply === 'object') reply = reply.text || '';
        res.end(JSON.stringify({reply: reply}));
      } catch (e) { res.end(JSON.stringify({error: String(e)})); }
    });
    return;
  }

  // API Image
  if (req.method === 'POST' && req.url === '/image') {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
      res.writeHead(200, {'Content-Type': 'application/json'});
      try {
        var data = JSON.parse(body);
        if (OPENAI_KEY === 'sk-your-openai-key-here') {
          res.end(JSON.stringify({error: 'Configure sua OpenAI Key no servidor.js'}));
          return;
        }
        var r = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + OPENAI_KEY},
          body: JSON.stringify({model: 'dall-e-3', prompt: data.prompt, n: 1, size: data.size || '1024x1024', response_format: 'url'})
        });
        var d = await r.json();
        if (!r.ok) { res.end(JSON.stringify({error: d.error && d.error.message || 'Erro'})); return; }
        res.end(JSON.stringify({url: d.data[0].url}));
      } catch (e) { res.end(JSON.stringify({error: String(e)})); }
    });
    return;
  }

  // API Design Chat - Cria designs automaticamente
  if (req.method === 'POST' && req.url === '/design-chat') {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
      res.writeHead(200, {'Content-Type': 'application/json'});
      try {
        var data = JSON.parse(body);
        var prompt = data.prompt;
        var w = data.canvasWidth || 1080;
        var h = data.canvasHeight || 1080;

        // Prompt para a IA criar o design
        var systemPrompt = 'Você é um designer gráfico expert. O usuário vai pedir para criar um design e você deve retornar apenas JSON válido.\n\n' +
          'Retorne APENAS este formato EXATO de JSON (nada mais, sem markdown, sem texto adicional):\n' +
          '{"message":"sua mensagem aqui","actions":[{"type":"background","color":"#000000"},{"type":"text","content":"texto","x":540,"y":400,"fontSize":80,"color":"#ffffff","fontFamily":"Inter"},{"type":"shape","shape":"rect","x":540,"y":300,"color":"#7c3aed","width":200,"height":100}]}\n\n' +
          'TIPOS DE ACTION:\n' +
          '- background: cor de fundo (use #000000 a #FFFFFF)\n' +
          '- text: texto com content, x, y, fontSize, color, fontFamily\n' +
          '- shape: forma com shape(rect/circle/triangle), x, y, color, width, height\n\n' +
          'REGRAS IMPORTANTES:\n' +
          '- Responda apenas com JSON válido\n' +
          '- message deve ser curta e em português\n' +
          '- Máximo 3 actions\n' +
          '- Para center use x:' + w + '/2, y:' + h + '/2\n' +
          '- Cores: #7c3aed(violet), #000000(preto), #ffffff(branco), #fbbf24(dourado), #ef4444(vermelho)\n' +
          '- Fontes: Inter, Arial, Georgia, Impact\n\n' +
          'EXEMPLO para "post promocional preto com texto dourado":\n' +
          '{"message":"Criei um post promocional elegante!","actions":[{"type":"background","color":"#000000"},{"type":"text","content":"PROMOÇÃO","x":' + w + '/2,"y":' + h + '/2,"fontSize":120,"color":"#fbbf24","fontFamily":"Inter"},{"type":"text","content":"50% OFF","x":' + w + '/2,"y":' + (h/2+150) + ',"fontSize":80,"color":"#ffffff","fontFamily":"Inter"}]}\n\n' +
          'AGORA RESPONDA APENAS COM JSON:';

        var r = await fetch(CHAT_API, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'x-api-key': CHAT_KEY, 'anthropic-version': '2023-06-01'},
          body: JSON.stringify({
            model: CHAT_MODEL,
            max_tokens: 500,
            messages: [
              {role: 'system', content: systemPrompt},
              {role: 'user', content: prompt}
            ]
          })
        });

        var text = await r.text();
        if (!r.ok) {
          res.end(JSON.stringify({error: 'Erro ao processar: ' + r.status}));
          return;
        }

        var d = JSON.parse(text);
        var reply = d.text || (d.content && d.content.find(function(c) { return c.type === 'text'; })) || '';
        if (typeof reply === 'object') reply = reply.text || '';

        // Limpar e parsear o JSON da resposta
        var cleanJson = reply.trim();
        // Remove markdown se houver
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
          var result = JSON.parse(cleanJson);
          res.end(JSON.stringify(result));
        } catch (e) {
          // Se falhar, retorna mensagem padrão
          res.end(JSON.stringify({
            message: reply || 'Entendi seu pedido! Infelizmente não consegui criar o design automaticamente.',
            actions: []
          }));
        }
      } catch (e) {
        res.end(JSON.stringify({error: String(e)}));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(process.env.PORT || 8787, function() {
  console.log('\n  Aura rodando!  http://localhost:' + (process.env.PORT || 8787) + '\n');
});
