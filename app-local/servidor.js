// App de chat local (uso privado) — serve a interface e conecta na API kpalabz.
// Requisito: Node.js 18+ (nodejs.org). Rodar: node servidor.js  → abrir http://localhost:8787
const http = require('http');
const API = 'https://api.kpalabz.com/v1/messages'; // <<< troque aqui se mudar de API
const KEY = 'sk-kpa-5e547f13b6323da4fea5f15fa600db8ce1af20cdc45e3105c05288fe40870d95';
const MODEL = 'claude-sonnet-4-20250514';

const HTML = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Aura</title>' +
'<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">' +
'<style>*{box-sizing:border-box}body{margin:0;height:100vh;display:flex;flex-direction:column;background:#f7f6f9;font-family:Outfit,sans-serif;color:#201d26}' +
'header{display:flex;align-items:center;gap:10px;padding:14px 24px;border-bottom:1px solid #e3e0ea;background:#fff}' +
'.logo{width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,#7c3aed,#a855f7)}' +
'#m{flex:1;overflow-y:auto;padding:28px 0}.col{max-width:720px;margin:0 auto;padding:0 24px;display:flex;flex-direction:column;gap:20px}' +
'.u{align-self:flex-end;max-width:78%;background:#ede9fe;border:1px solid #ddd2fb;padding:11px 15px;border-radius:15px 15px 4px 15px;font-size:14.5px;line-height:1.55;white-space:pre-wrap}' +
'.a{display:flex;gap:11px;max-width:88%}.a .logo{flex-shrink:0;margin-top:2px}.a div.t{font-size:14.5px;line-height:1.65;white-space:pre-wrap;padding-top:2px}' +
'#dots{display:none;gap:4px;align-items:center}#dots span{width:6px;height:6px;border-radius:50%;background:#6d28d9;animation:b 1.2s infinite}' +
'#dots span:nth-child(2){animation-delay:.2s}#dots span:nth-child(3){animation-delay:.4s}@keyframes b{0%,80%,100%{opacity:.25}40%{opacity:1}}' +
'footer{padding:0 24px 20px}.box{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e3e0ea;border-radius:15px;box-shadow:0 4px 20px rgba(32,29,38,.06);padding:11px 13px;display:flex;align-items:flex-end;gap:10px}' +
'textarea{flex:1;border:none;outline:none;resize:none;font:14.5px/1.5 Outfit,sans-serif;min-height:24px;max-height:150px;background:transparent}' +
'button{width:36px;height:36px;border:none;border-radius:10px;background:#6d28d9;color:#fff;font-size:16px;cursor:pointer}button:hover{background:#5b21b6}' +
'.hint{max-width:720px;margin:8px auto 0;text-align:center;font-size:11.5px;color:#8d879b}</style></head><body>' +
'<header><div class="logo"></div><b style="font-size:16px">Aura</b><span style="margin-left:auto;font-size:12px;color:#6f6a7a;background:#efedf4;border:1px solid #e3e0ea;padding:3px 10px;border-radius:99px">' + MODEL + '</span></header>' +
'<div id="m"><div class="col" id="col"><div class="a"><div class="logo"></div><div class="t">Oi! Estou conectado na sua API. Como posso ajudar?</div></div>' +
'<div id="dots" class="a"><div class="logo"></div><span></span><span></span><span></span></div></div></div>' +
'<footer><div class="box"><textarea id="i" rows="1" placeholder="Escreva sua mensagem\u2026"></textarea><button onclick="send()" title="Enviar">\u2191</button></div>' +
'<div class="hint">Enter envia \u00b7 Shift+Enter quebra linha \u00b7 uso privado</div></footer>' +
'<script>var msgs=[],col=document.getElementById("col"),m=document.getElementById("m"),dots=document.getElementById("dots"),inp=document.getElementById("i");' +
'function add(role,text){var d=document.createElement("div");if(role==="user"){d.className="u";d.textContent=text}else{d.className="a";d.innerHTML="<div class=logo></div>";var t=document.createElement("div");t.className="t";t.textContent=text;d.appendChild(t)}col.insertBefore(d,dots);m.scrollTop=m.scrollHeight}' +
'function send(){var v=inp.value.trim();if(!v||dots.style.display==="flex")return;msgs.push({role:"user",content:v});add("user",v);inp.value="";dots.style.display="flex";m.scrollTop=m.scrollHeight;' +
'fetch("/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:msgs})}).then(function(r){return r.json()}).then(function(d){dots.style.display="none";var t=d.reply||"Erro: "+(d.error||"desconhecido");msgs.push({role:"assistant",content:t});add("assistant",t)}).catch(function(e){dots.style.display="none";add("assistant","Erro: "+e.message)})}' +
'inp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});<\/script></body></html>';

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const { messages } = JSON.parse(body);
        const r = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: MODEL, max_tokens: 1024, messages })
        });
        const text = await r.text();
        if (!r.ok) { res.end(JSON.stringify({ error: 'HTTP ' + r.status + ' — ' + text.slice(0, 300) })); return; }
        const d = JSON.parse(text);
        res.end(JSON.stringify({ reply: (d.content && d.content[0] && d.content[0].text) || JSON.stringify(d) }));
      } catch (e) { res.end(JSON.stringify({ error: String(e) })); }
    });
    return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(HTML);
}).listen(process.env.PORT || 8787, () => console.log('\n  Aura rodando!  Abra no navegador:  http://localhost:' + (process.env.PORT || 8787) + '\n'));
