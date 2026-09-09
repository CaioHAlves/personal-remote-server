const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8080;
const ROOT = process.env.HOME || '/data/data/com.termux/files/home';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
};

function getIcon(name, isDir) {
  if (isDir) return '&#128193;';
  const ext = path.extname(name).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) return '&#128247;';
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return '&#127925;';
  if (['.mp4', '.avi', '.mkv', '.mov'].includes(ext)) return '&#127916;';
  if (['.pdf'].includes(ext)) return '&#128211;';
  if (['.zip', '.tar', '.gz', '.7z', '.rar'].includes(ext)) return '&#128230;';
  if (['.js', '.ts', '.py', '.sh', '.bash'].includes(ext)) return '&#128187;';
  if (['.md', '.txt', '.doc'].includes(ext)) return '&#128196;';
  return '&#128196;';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderPage(dirPath, relativePath) {
  let items = [];
  try {
    items = fs.readdirSync(dirPath);
  } catch (e) {
    return `<html><body><h1>Error reading directory</h1><p>${e.message}</p></body></html>`;
  }

  const parentDir = path.dirname(relativePath);
  const showParent = relativePath !== '/';

  let rows = '';
  if (showParent) {
    const parentUrl = parentDir === '/' ? '/' : encodeURIComponent(parentDir);
    rows += `<tr><td><a href="${parentUrl}">&#128193; ..</a></td><td></td></tr>`;
  }

  for (const name of items) {
    const fullPath = path.join(dirPath, name);
    let isDir = false;
    let size = 0;
    try {
      const stat = fs.statSync(fullPath);
      isDir = stat.isDirectory();
      size = stat.size;
    } catch (e) {}

    const itemPath = relativePath === '/' ? '/' + name : relativePath + '/' + name;
    const url = itemPath.split('/').map(encodeURIComponent).join('/');
    const icon = getIcon(name, isDir);
    const sizeStr = isDir ? '-' : formatSize(size);

    rows += `<tr><td><a href="${url}">${icon} ${name}</a></td><td>${sizeStr}</td></tr>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Files - ${relativePath}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; min-height: 100vh; }
    .header { background: #16213e; padding: 15px 20px; border-bottom: 1px solid #0f3460; }
    .header h1 { font-size: 18px; color: #e94560; }
    .header .path { color: #aaa; font-size: 14px; margin-top: 5px; }
    .content { padding: 20px; max-width: 900px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 15px; text-align: left; border-bottom: 1px solid #333; }
    th { background: #16213e; color: #e94560; }
    a { color: #53a8ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    tr:hover { background: #16213e; }
    .empty { color: #666; text-align: center; padding: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>&#128193; Termux Files</h1>
    <div class="path">${relativePath}</div>
  </div>
  <div class="content">
    ${items.length === 0 ? '<div class="empty">Pasta vazia</div>' : `
    <table>
      <thead><tr><th>Nome</th><th>Tamanho</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`}
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const fullPath = path.join(ROOT, urlPath === '/' ? '' : urlPath);

  // Security check
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderPage(fullPath, urlPath));
    } else {
      // Serve file
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<html><body><h1>404 - Not Found</h1><p>${e.message}</p><a href="/">Voltar</a></body></html>`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`File server running on http://0.0.0.0:${PORT}`);
});
