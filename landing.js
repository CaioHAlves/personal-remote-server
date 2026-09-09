const http = require('http');
const PORT = 8000;
const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termux Remote</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; display: flex; justify-content: center; align-items: center; height: 100vh; }
    .container { text-align: center; }
    h1 { color: #e94560; margin-bottom: 30px; font-size: 28px; }
    .cards { display: flex; gap: 30px; }
    .card { background: #16213e; padding: 40px 50px; border-radius: 12px; text-decoration: none; color: #eee; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #0f3460; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(233,69,96,0.3); }
    .card h2 { font-size: 20px; margin-bottom: 10px; }
    .card p { color: #aaa; font-size: 14px; }
    .icon { font-size: 40px; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Termux Remote</h1>
    <div class="cards">
      <a class="card" href="/terminal/">
        <div class="icon">&#9000;</div>
        <h2>Terminal</h2>
        <p>Shell completo do Termux</p>
      </a>
      <a class="card" href="/files/">
        <div class="icon">&#128193;</div>
        <h2>Arquivos</h2>
        <p>Gerenciador de arquivos</p>
      </a>
    </div>
  </div>
</body>
</html>`;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});
server.listen(PORT, '0.0.0.0', () => console.log(`Landing page: http://localhost:${PORT}`));
