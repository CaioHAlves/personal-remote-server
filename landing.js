const http = require('http');
const PORT = 8000;

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termux Remote Access</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f0f23; color: #eee; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { text-align: center; max-width: 600px; padding: 20px; }
    h1 { color: #e94560; margin-bottom: 8px; font-size: 32px; }
    .subtitle { color: #888; margin-bottom: 40px; font-size: 14px; }
    .cards { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
    .card { background: #16213e; padding: 35px 40px; border-radius: 12px; text-decoration: none; color: #eee; transition: all 0.3s; border: 1px solid #1a1a4e; min-width: 200px; }
    .card:hover { transform: translateY(-8px); box-shadow: 0 15px 40px rgba(233,69,96,0.25); border-color: #e94560; }
    .card h2 { font-size: 18px; margin-bottom: 8px; }
    .card p { color: #888; font-size: 13px; }
    .icon { font-size: 48px; margin-bottom: 15px; display: block; }
    .footer { margin-top: 50px; color: #555; font-size: 12px; }
    .footer a { color: #e94560; text-decoration: none; }
    input { background: #16213e; border: 1px solid #1a1a4e; color: #eee; padding: 10px 15px; border-radius: 8px; width: 100%; margin-top: 15px; font-size: 13px; text-align: center; }
    input:focus { outline: none; border-color: #e94560; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Termux Remote</h1>
    <p class="subtitle">Acesse seu celular de qualquer computador</p>

    <div class="cards">
      <a class="card" id="terminal-card">
        <span class="icon">&#9000;</span>
        <h2>Terminal</h2>
        <p>Shell completo do Termux</p>
      </a>
      <a class="card" id="files-card">
        <span class="icon">&#128193;</span>
        <h2>Arquivos</h2>
        <p>Gerenciador de arquivos</p>
      </a>
    </div>

    <input type="text" id="token" placeholder="Cole a URL do terminal aqui (ex: https://xxx.trycloudflare.com)" />

    <div class="footer">
      <p>Feito por <a href="https://github.com/CaioHAlves">CaioHAlves</a></p>
    </div>
  </div>

  <script>
    const tokenInput = document.getElementById('token');
    const saved = localStorage.getItem('terminal_url');
    if (saved) tokenInput.value = saved;

    tokenInput.addEventListener('input', () => {
      localStorage.setItem('terminal_url', tokenInput.value);
    });

    document.getElementById('terminal-card').addEventListener('click', () => {
      const url = tokenInput.value.trim();
      if (url) window.open(url, '_blank');
      else alert('Cole a URL do terminal no campo abaixo!');
    });

    document.getElementById('files-card').addEventListener('click', () => {
      const url = localStorage.getItem('files_url');
      if (url) window.open(url, '_blank');
      else alert('URL dos arquivos ainda nao configurada.');
    });

    // Auto-detect files URL from terminal URL
    tokenInput.addEventListener('input', () => {
      const t = tokenInput.value.trim();
      if (t.includes('trycloudflare.com')) {
        // Files URL will be shown after terminal connects
      }
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Landing page: http://localhost:${PORT}`);
});
