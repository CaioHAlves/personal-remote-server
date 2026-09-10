const http = require('http');
const net = require('net');
const url = require('url');

const PORT = 9090;
const TERMINAL_PORT = 7681;
const FILES_PORT = 8080;

function pipeSockets(client, target, initialData) {
  target.connect(TERMINAL_PORT, '127.0.0.1', () => {
    if (initialData) target.write(initialData);
    target.pipe(client);
    client.pipe(target);
  });
  target.on('error', () => client.destroy());
  client.on('error', () => target.destroy());
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const path = parsed.path;

  if (path === '/terminal' || path.startsWith('/terminal/')) {
    const targetPath = path.replace('/terminal', '') || '/';
    const targetReq = http.request({
      hostname: '127.0.0.1',
      port: TERMINAL_PORT,
      path: targetPath,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${TERMINAL_PORT}` }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    targetReq.on('error', () => { res.writeHead(502); res.end('Terminal offline'); });
    req.pipe(targetReq);
    return;
  }

  const targetReq = http.request({
    hostname: '127.0.0.1',
    port: FILES_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${FILES_PORT}` }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  targetReq.on('error', () => { res.writeHead(502); res.end('Files offline'); });
  req.pipe(targetReq);
});

server.on('upgrade', (req, socket, head) => {
  const path = url.parse(req.url).path;

  if (path.startsWith('/terminal')) {
    const targetPath = path.replace('/terminal', '') || '/';
    const rawReq =
      `${req.method} ${targetPath} HTTP/${req.httpVersion}\r\n` +
      Object.entries(req.headers)
        .filter(([k]) => k !== 'connection' && k !== 'upgrade')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n';

    pipeSockets(socket, new net.Socket(), rawReq);
    return;
  }

  socket.destroy();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy ativo em http://localhost:${PORT}`);
});
