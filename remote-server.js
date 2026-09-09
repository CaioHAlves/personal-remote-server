const http = require('http');
const { spawn } = require('child_process');

const PORT = 8000;
const WORK_DIR = process.env.HOME || '/data/data/com.termux/files/home';

// Start ttyd
const ttyd = spawn('ttyd', ['-p', '7681', '-W', 'bash'], {
  cwd: WORK_DIR,
  stdio: 'ignore'
});
console.log(`ttyd started with PID ${ttyd.pid}`);

// Start filebrowser
const filebrowser = spawn('filebrowser', [
  '-p', '8080',
  '-r', WORK_DIR,
  '--noauth',
  '--address', '127.0.0.1'
], {
  cwd: WORK_DIR,
  stdio: 'ignore'
});
console.log(`filebrowser started with PID ${filebrowser.pid}`);

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termux Remote</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; height: 100vh; display: flex; flex-direction: column; }
    .header { background: #16213e; padding: 12px 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #0f3460; }
    .header h1 { font-size: 18px; color: #e94560; }
    .tabs { display: flex; gap: 5px; }
    .tab { padding: 8px 18px; background: #0f3460; border: none; color: #aaa; cursor: pointer; border-radius: 6px 6px 0 0; font-size: 14px; transition: all 0.2s; }
    .tab:hover { background: #1a1a4e; color: #eee; }
    .tab.active { background: #e94560; color: #fff; }
    .content { flex: 1; overflow: hidden; }
    .panel { display: none; width: 100%; height: 100%; border: none; }
    .panel.active { display: block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Termux Remote</h1>
    <div class="tabs">
      <button class="tab active" onclick="showTab('terminal', this)">Terminal</button>
      <button class="tab" onclick="showTab('files', this)">Arquivos</button>
    </div>
  </div>
  <div class="content">
    <iframe id="terminal" class="panel active" src="/terminal/"></iframe>
    <iframe id="files" class="panel" src="/files/"></iframe>
  </div>
  <script>
    function showTab(name, el) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(name).classList.add('active');
      el.classList.add('active');
    }
  </script>
</body>
</html>`;

function proxy(req, res, targetPort) {
  const opts = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${targetPort}` }
  };
  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end('Service unavailable: ' + err.message);
  });
  req.pipe(proxyReq);
}

function proxyWs(req, socket, head, targetPort) {
  const opts = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  const proxyReq = http.request(opts);
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    let headBuf = Buffer.from(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      `Upgrade: ${proxyRes.headers['upgrade'] || 'websocket'}\r\n` +
      `Connection: Upgrade\r\n\r\n`
    );
    socket.write(headBuf);
    if (proxyHead.length) proxySocket.unshift(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', () => { socket.destroy(); });
  if (head.length) proxyReq.write(head);
  proxyReq.end();
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }
  if (req.url.startsWith('/terminal')) {
    req.url = req.url.replace(/^\/terminal/, '') || '/';
    proxy(req, res, 7681);
    return;
  }
  if (req.url.startsWith('/files')) {
    req.url = req.url.replace(/^\/files/, '') || '/';
    proxy(req, res, 8080);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

// Handle WebSocket upgrades for ttyd
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/terminal')) {
    req.url = req.url.replace(/^\/terminal/, '') || '/';
    proxyWs(req, socket, head, 7681);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Interface rodando em http://localhost:${PORT}`);
});

process.on('SIGTERM', () => { ttyd.kill(); filebrowser.kill(); process.exit(); });
process.on('SIGINT', () => { ttyd.kill(); filebrowser.kill(); process.exit(); });
