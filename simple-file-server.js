const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PORT = process.env.FILE_SERVER_PORT || 8080;
const ROOT = process.env.HOME || '/data/data/com.termux/files/home';
const PASSWORD = process.env.FILE_SERVER_PASS || '';
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');

const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain', '.md': 'text/markdown', '.pdf': 'application/pdf',
  '.zip': 'application/zip', '.tar': 'application/x-tar', '.gz': 'application/gzip',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

// --- Sessions ---
const sessions = new Map();

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { created: Date.now() });
  return token;
}

function isValidSession(token) {
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token);
  if (Date.now() - s.created > 86400000) { sessions.delete(token); return false; }
  return true;
}

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k) cookies[k] = decodeURIComponent(v || '');
  });
  return cookies;
}

// --- System Info ---
function getStorageInfo() {
  try {
    const out = execSync("df -h /storage/emulated/0 2>/dev/null | tail -1", { encoding: 'utf8' });
    const parts = out.trim().split(/\s+/);
    return { total: parts[1], used: parts[2], avail: parts[3], pct: parts[4] };
  } catch { return null; }
}

function getBatteryInfo() {
  const paths = [
    '/sys/class/power_supply/battery/capacity',
    '/sys/class/power_supply/Battery/capacity',
  ];
  for (const p of paths) {
    try {
      const level = parseInt(fs.readFileSync(p, 'utf8').trim());
      let charging = 'Unknown';
      const statusPath = p.replace('capacity', 'status');
      try { charging = fs.readFileSync(statusPath, 'utf8').trim(); } catch {}
      return { level, charging };
    } catch {}
  }
  try {
    const out = execSync("timeout 3 termux-battery-status 2>/dev/null", { encoding: 'utf8' });
    const j = JSON.parse(out);
    if (j.percentage !== 'N/A') return { level: j.percentage, charging: j.status };
  } catch {}
  return null;
}

function getMemoryInfo() {
  try {
    const out = fs.readFileSync('/proc/meminfo', 'utf8');
    const total = parseInt(out.match(/MemTotal:\s+(\d+)/)?.[1] || 0);
    const free = parseInt(out.match(/MemAvailable:\s+(\d+)/)?.[1] || 0);
    return {
      total: (total / 1048576).toFixed(1) + ' GB',
      used: ((total - free) / 1048576).toFixed(1) + ' GB',
      pct: Math.round(((total - free) / total) * 100) + '%',
    };
  } catch { return null; }
}

// --- Utilities ---
function getIcon(name, isDir) {
  if (isDir) return '&#128193;';
  const ext = path.extname(name).toLowerCase();
  if (['.jpg','.jpeg','.png','.gif','.svg','.webp','.bmp'].includes(ext)) return '&#128247;';
  if (['.mp3','.wav','.ogg','.m4a','.flac','.aac'].includes(ext)) return '&#127925;';
  if (['.mp4','.avi','.mkv','.mov','.webm','.flv'].includes(ext)) return '&#127916;';
  if (['.pdf'].includes(ext)) return '&#128211;';
  if (['.zip','.tar','.gz','.7z','.rar','.bz2'].includes(ext)) return '&#128230;';
  if (['.js','.ts','.py','.sh','.bash','.rb','.go','.rs','.java'].includes(ext)) return '&#128187;';
  if (['.md','.txt','.doc','.docx','.rtf'].includes(ext)) return '&#128196;';
  if (['.json','.xml','.yaml','.yml','.toml'].includes(ext)) return '&#128196;';
  if (['.css','.html','.htm'].includes(ext)) return '&#127760;';
  return '&#128196;';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function isTextFile(name) {
  const ext = path.extname(name).toLowerCase();
  return ['.txt','.md','.json','.js','.ts','.py','.sh','.bash','.css','.html','.htm',
    '.xml','.yaml','.yml','.toml','.csv','.log','.conf','.cfg','.ini','.rb','.go',
    '.rs','.java','.c','.cpp','.h','.hpp','.php','.sql','.env','.gitignore',
    '.dockerignore','.makefile','.vue','.svelte','.jsx','.tsx'].includes(ext);
}

function parseMultipart(req, callback) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return callback(new Error('No boundary'));
  const boundary = boundaryMatch[1];
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    const parts = [];
    const boundaryBuf = Buffer.from('--' + boundary);
    let start = 0;
    while (true) {
      const idx = buf.indexOf(boundaryBuf, start);
      if (idx === -1) break;
      if (start > 0) {
        const part = buf.slice(start, idx - 2);
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const headers = part.slice(0, headerEnd).toString();
          const body = part.slice(headerEnd + 4);
          const nameMatch = headers.match(/name="([^"]+)"/);
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            parts.push({ name: nameMatch?.[1], filename: filenameMatch[1], data: body });
          }
        }
      }
      start = idx + boundaryBuf.length + 2;
    }
    callback(null, parts);
  });
  req.on('error', callback);
}

// --- HTML Renderer ---
function renderPage(dirPath, relativePath, query) {
  let items = [];
  try { items = fs.readdirSync(dirPath); } catch (e) {
    return renderLogin() || `<html><body><h1>Error: ${e.message}</h1></body></html>`;
  }

  const storage = getStorageInfo();
  const battery = getBatteryInfo();
  const memory = getMemoryInfo();
  const view = query.view || 'list';
  const parentDir = path.dirname(relativePath);
  const showParent = relativePath !== '/';

  let itemsHtml = '';
  const sorted = items.sort((a, b) => {
    const aFull = path.join(dirPath, a);
    const bFull = path.join(dirPath, b);
    try {
      const aDir = fs.statSync(aFull).isDirectory();
      const bDir = fs.statSync(bFull).isDirectory();
      if (aDir && !bDir) return -1;
      if (!aDir && bDir) return 1;
    } catch {}
    return a.localeCompare(b);
  });

  if (showParent) {
    const pUrl = parentDir === '/' ? '/' : parentDir.split('/').map(encodeURIComponent).join('/');
    itemsHtml += buildItemHtml('..', pUrl, true, 0, '', view);
  }

  for (const name of sorted) {
    const fullPath = path.join(dirPath, name);
    let isDir = false, size = 0, mtime = '';
    try {
      const stat = fs.statSync(fullPath);
      isDir = stat.isDirectory();
      size = stat.size;
      mtime = new Date(stat.mtime).toLocaleDateString('pt-BR');
    } catch {}
    const itemPath = relativePath === '/' ? '/' + name : relativePath + '/' + name;
    const url = itemPath.split('/').map(encodeURIComponent).join('/');
    itemsHtml += buildItemHtml(name, url, isDir, size, mtime, view);
  }

  const storageBar = storage ? `<div class="sys-bar"><span>&#128190; ${storage.used}/${storage.total} (${storage.pct})</span><div class="progress"><div class="progress-fill" style="width:${storage.pct}"></div></div></div>` : '';
  const batteryHtml = battery ? `<div class="sys-item">&#128267; ${battery.level}%</div>` : '';
  const memHtml = memory ? `<div class="sys-item">&#128187; ${memory.used} RAM</div>` : '';

  const breadcrumb = buildBreadcrumb(relativePath);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Files - ${relativePath}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f0f1a;--surface:#1a1a2e;--surface2:#16213e;--accent:#e94560;--accent2:#0f3460;
--text:#eee;--text2:#aaa;--blue:#53a8ff;--green:#4caf50;--orange:#ff9800;--red:#f44336;--radius:8px}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
.header{background:var(--surface);padding:12px 16px;border-bottom:1px solid var(--accent2);position:sticky;top:0;z-index:100}
.header-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.header h1{font-size:16px;color:var(--accent);flex-shrink:0}
.sys-bar{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text2);flex:1;min-width:150px}
.progress{flex:1;height:6px;background:#333;border-radius:3px;max-width:200px}
.progress-fill{height:100%;background:var(--green);border-radius:3px;transition:width .3s}
.sys-item{font-size:11px;color:var(--text2);white-space:nowrap}
.toolbar{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap}
.view-btn{background:var(--surface2);border:1px solid #333;color:var(--text);padding:4px 10px;border-radius:var(--radius);cursor:pointer;font-size:12px;transition:all .2s}
.view-btn:hover,.view-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.action-btn{background:var(--accent2);border:1px solid #333;color:var(--blue);padding:4px 10px;border-radius:var(--radius);cursor:pointer;font-size:12px;transition:all .2s}
.action-btn:hover{background:var(--blue);color:#fff;border-color:var(--blue)}
.action-btn.danger:hover{background:var(--red);border-color:var(--red)}
.breadcrumb{padding:8px 16px;font-size:13px;color:var(--text2);background:var(--bg);border-bottom:1px solid #222}
.breadcrumb a{color:var(--blue);text-decoration:none;margin:0 4px}
.breadcrumb a:hover{text-decoration:underline}
.content{padding:8px 16px 100px}
/* List view */
.view-list{width:100%}
.view-list .item{display:grid;grid-template-columns:30px 1fr 80px 90px 40px;align-items:center;padding:8px 10px;border-bottom:1px solid #222;gap:8px;transition:background .15s}
.view-list .item:hover{background:var(--surface2)}
.view-list .item .icon{font-size:18px;text-align:center}
.view-list .item .name{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.view-list .item .name a{color:var(--blue);text-decoration:none}
.view-list .item .name a:hover{text-decoration:underline}
.view-list .item .size{font-size:12px;color:var(--text2);text-align:right}
.view-list .item .date{font-size:11px;color:#666;text-align:right}
.view-list .item .menu-btn{background:none;border:none;color:var(--text2);cursor:pointer;font-size:16px;padding:4px;border-radius:4px}
.view-list .item .menu-btn:hover{background:#333;color:#fff}
.view-list .header-row{display:grid;grid-template-columns:30px 1fr 80px 90px 40px;padding:8px 10px;font-size:11px;color:var(--accent);border-bottom:1px solid var(--accent2);gap:8px;font-weight:600}
/* Grid view */
.view-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
.view-grid .item{background:var(--surface);border-radius:var(--radius);padding:12px 8px;text-align:center;cursor:pointer;border:1px solid transparent;transition:all .15s;position:relative}
.view-grid .item:hover{border-color:var(--accent);transform:translateY(-2px)}
.view-grid .item .icon{font-size:36px;margin-bottom:6px}
.view-grid .item .name{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)}
.view-grid .item .size{font-size:10px;color:var(--text2);margin-top:2px}
.view-grid .item .check{position:absolute;top:6px;left:6px;width:18px;height:18px;border-radius:4px;background:var(--surface2);border:1px solid #444;display:none;align-items:center;justify-content:center;font-size:12px}
.view-grid .item.selected .check{display:flex;background:var(--accent);border-color:var(--accent)}
.view-grid .item.selected{border-color:var(--accent)}
/* Icons view */
.view-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px}
.view-icons .item{text-align:center;padding:8px 4px;cursor:pointer;border-radius:var(--radius);transition:background .15s;position:relative}
.view-icons .item:hover{background:var(--surface2)}
.view-icons .item .icon{font-size:28px}
.view-icons .item .name{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);margin-top:4px}
.view-icons .item .check{position:absolute;top:4px;right:4px;width:16px;height:16px;border-radius:3px;background:var(--surface2);border:1px solid #444;display:none;align-items:center;justify-content:center;font-size:10px}
.view-icons .item.selected .check{display:flex;background:var(--accent);border-color:var(--accent)}
.selection-bar{position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:1px solid var(--accent2);padding:10px 16px;display:none;align-items:center;gap:10px;z-index:100;flex-wrap:wrap}
.selection-bar.show{display:flex}
.selection-bar .info{font-size:13px;color:var(--text2);flex:1}
/* Modals */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;align-items:center;justify-content:center}
.modal-overlay.show{display:flex}
.modal{background:var(--surface);border:1px solid var(--accent2);border-radius:var(--radius);padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto}
.modal h3{color:var(--accent);margin-bottom:12px;font-size:16px}
.modal input,.modal textarea{width:100%;padding:8px 12px;background:var(--bg);border:1px solid #333;border-radius:var(--radius);color:var(--text);font-size:14px;margin-bottom:10px;font-family:inherit}
.modal textarea{min-height:300px;resize:vertical;font-family:'Fira Code',monospace;font-size:13px}
.modal .btn-row{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}
.modal .btn{padding:6px 16px;border-radius:var(--radius);border:1px solid #333;cursor:pointer;font-size:13px;transition:all .2s}
.modal .btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.modal .btn-primary:hover{opacity:.8}
.modal .btn-cancel{background:var(--surface2);color:var(--text)}
.modal .btn-danger{background:var(--red);color:#fff;border-color:var(--red)}
/* Context menu */
.ctx-menu{position:fixed;background:var(--surface);border:1px solid #333;border-radius:var(--radius);padding:4px 0;min-width:150px;z-index:300;display:none;box-shadow:0 4px 20px rgba(0,0,0,.5)}
.ctx-menu.show{display:block}
.ctx-menu-item{padding:8px 14px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:8px;transition:background .1s}
.ctx-menu-item:hover{background:var(--surface2)}
.ctx-menu-item.danger{color:var(--red)}
/* Upload zone */
.upload-zone{border:2px dashed #333;border-radius:var(--radius);padding:30px;text-align:center;color:var(--text2);margin:10px 0;transition:all .2s;display:none}
.upload-zone.show{display:block}
.upload-zone.dragover{border-color:var(--accent);background:rgba(233,69,96,.05);color:var(--text)}
.upload-progress{margin-top:8px}
.upload-progress .bar{height:4px;background:#333;border-radius:2px;margin-top:4px}
.upload-progress .fill{height:100%;background:var(--green);border-radius:2px;transition:width .3s}
/* Login */
.login-wrapper{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg)}
.login-box{background:var(--surface);border:1px solid var(--accent2);border-radius:var(--radius);padding:30px;width:320px;text-align:center}
.login-box h2{color:var(--accent);margin-bottom:20px}
.login-box input{width:100%;padding:10px 14px;background:var(--bg);border:1px solid #333;border-radius:var(--radius);color:var(--text);font-size:15px;margin-bottom:12px;text-align:center}
.login-box button{width:100%;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:15px;cursor:pointer;transition:opacity .2s}
.login-box button:hover{opacity:.85}
.login-box .error{color:var(--red);font-size:13px;margin-bottom:8px}
.empty{color:#555;text-align:center;padding:50px 20px;font-size:14px}
.toast{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--accent2);padding:10px 20px;border-radius:var(--radius);font-size:13px;z-index:400;display:none;animation:fadeIn .2s}
.toast.show{display:block}
.toast.success{border-color:var(--green);color:var(--green)}
.toast.error{border-color:var(--red);color:var(--red)}
@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@media(max-width:600px){
.view-list .item{grid-template-columns:28px 1fr 60px 36px}
.view-list .item .date{display:none}
.view-list .header-row{grid-template-columns:28px 1fr 60px 36px}
.view-list .header-row .h-date{display:none}
.sys-bar{display:none}
}
</style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <h1>&#128193; Files</h1>
    ${storageBar}
    ${batteryHtml}
    ${memHtml}
  </div>
  <div class="toolbar">
    <button class="view-btn ${view==='list'?'active':''}" onclick="setView('list')" title="Lista">&#9776;</button>
    <button class="view-btn ${view==='grid'?'active':''}" onclick="setView('grid')" title="Grade">&#9638;</button>
    <button class="view-btn ${view==='icons'?'active':''}" onclick="setView('icons')" title="Icones">&#8862;</button>
    <div style="flex:1"></div>
    <button class="action-btn" onclick="showUpload()">&#8593; Upload</button>
    <button class="action-btn" onclick="showNewFolder()">&#128193;+ Nova Pasta</button>
  </div>
</div>

<div class="breadcrumb">${breadcrumb}</div>

<div class="upload-zone" id="uploadZone">
  &#128228; Arraste arquivos aqui ou clique para selecionar
  <input type="file" id="fileInput" multiple style="display:none">
  <div class="upload-progress" id="uploadProgress" style="display:none">
    <span id="uploadText">Enviando...</span>
    <div class="bar"><div class="fill" id="uploadFill" style="width:0%"></div></div>
  </div>
</div>

<div class="content">
  <div class="view-${view}" id="itemsContainer">
    ${items.length === 0 && !showParent ? '<div class="empty">&#128193; Pasta vazia</div>' : ''}
    ${view === 'list' ? `<div class="header-row"><span></span><span>Nome</span><span class="h-size" style="text-align:right">Tam.</span><span class="h-date" style="text-align:right">Data</span><span></span></div>` : ''}
    ${itemsHtml}
  </div>
</div>

<div class="selection-bar" id="selectionBar">
  <div class="info"><span id="selCount">0</span> selecionado(s)</div>
  <button class="action-btn" onclick="downloadSelected()">&#128229; Baixar ZIP</button>
  <button class="action-btn danger" onclick="deleteSelected()">&#128465; Excluir</button>
  <button class="action-btn" onclick="clearSelection()">Cancelar</button>
</div>

<div class="modal-overlay" id="renameModal">
  <div class="modal">
    <h3>&#9998; Renomear</h3>
    <input type="text" id="renameInput" placeholder="Novo nome">
    <input type="hidden" id="renameOldPath">
    <div class="btn-row">
      <button class="btn btn-cancel" onclick="closeModal('renameModal')">Cancelar</button>
      <button class="btn btn-primary" onclick="doRename()">Renomear</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="editModal">
  <div class="modal" style="max-width:700px">
    <h3>&#9998; Editar: <span id="editFileName"></span></h3>
    <textarea id="editContent" spellcheck="false"></textarea>
    <input type="hidden" id="editPath">
    <div class="btn-row">
      <button class="btn btn-cancel" onclick="closeModal('editModal')">Cancelar</button>
      <button class="btn btn-primary" onclick="doSave()">Salvar</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="newFolderModal">
  <div class="modal">
    <h3>&#128193; Nova Pasta</h3>
    <input type="text" id="newFolderInput" placeholder="Nome da pasta">
    <div class="btn-row">
      <button class="btn btn-cancel" onclick="closeModal('newFolderModal')">Cancelar</button>
      <button class="btn btn-primary" onclick="doNewFolder()">Criar</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="deleteModal">
  <div class="modal">
    <h3>&#128465; Excluir</h3>
    <p id="deleteMsg" style="font-size:14px;color:var(--text2);margin-bottom:8px"></p>
    <div class="btn-row">
      <button class="btn btn-cancel" onclick="closeModal('deleteModal')">Cancelar</button>
      <button class="btn btn-danger" onclick="doDelete()">Excluir</button>
    </div>
  </div>
</div>

<div class="ctx-menu" id="ctxMenu">
  <div class="ctx-menu-item" onclick="ctxOpen()">&#128194; Abrir</div>
  <div class="ctx-menu-item" onclick="ctxRename()">&#9998; Renomear</div>
  <div class="ctx-menu-item" onclick="ctxEdit()">&#9998; Editar</div>
  <div class="ctx-menu-item" onclick="ctxDownload()">&#128229; Baixar</div>
  <div class="ctx-menu-item" onclick="ctxCopyPath()">&#128203; Copiar caminho</div>
  <div class="ctx-menu-item danger" onclick="ctxDelete()">&#128465; Excluir</div>
</div>

<div class="toast" id="toast"></div>

<script>
const CURRENT_PATH = ${JSON.stringify(relativePath)};
let viewMode = localStorage.getItem('viewMode') || '${view}';
let selected = new Set();
let ctxTarget = null;

function setView(v) {
  viewMode = v;
  localStorage.setItem('viewMode', v);
  window.location.href = window.location.pathname + '?view=' + v;
}

function showUpload() {
  const z = document.getElementById('uploadZone');
  z.classList.toggle('show');
  if (z.classList.contains('show')) document.getElementById('fileInput').click();
}

// File input & drag-drop
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
document.addEventListener('DOMContentLoaded', () => {
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', e => handleFiles(e.target.files));
  document.addEventListener('click', () => hideCtx());
  document.addEventListener('contextmenu', e => {
    const item = e.target.closest('.item');
    if (item) { e.preventDefault(); showCtx(e, item); }
  });
});

function handleFiles(files) {
  if (!files.length) return;
  const prog = document.getElementById('uploadProgress');
  const fill = document.getElementById('uploadFill');
  const txt = document.getElementById('uploadText');
  prog.style.display = 'block';
  let done = 0;
  const total = files.length;

  function uploadNext(i) {
    if (i >= files.length) {
      txt.textContent = 'Concluido!';
      fill.style.width = '100%';
      setTimeout(() => location.reload(), 500);
      return;
    }
    const fd = new FormData();
    fd.append('file', files[i]);
    fd.append('dir', CURRENT_PATH);
    txt.textContent = 'Enviando ' + (i+1) + '/' + total + ': ' + files[i].name;
    fill.style.width = ((i / total) * 100) + '%';
    fetch('/api/upload', { method: 'POST', body: fd }).then(() => uploadNext(i + 1)).catch(() => {
      txt.textContent = 'Erro no upload'; fill.style.width = '0%';
    });
  }
  uploadNext(0);
}

// Selection
function toggleSelect(el, path) {
  el.classList.toggle('selected');
  if (selected.has(path)) selected.delete(path); else selected.add(path);
  updateSelectionBar();
}
function updateSelectionBar() {
  const bar = document.getElementById('selectionBar');
  document.getElementById('selCount').textContent = selected.size;
  bar.classList.toggle('show', selected.size > 0);
}
function clearSelection() {
  selected.clear();
  document.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
  updateSelectionBar();
}
function downloadSelected() {
  if (!selected.size) return;
  window.location.href = '/api/zip?paths=' + [...selected].map(encodeURIComponent).join(',') + '&dir=' + encodeURIComponent(CURRENT_PATH);
}
function deleteSelected() {
  if (!selected.size) return;
  document.getElementById('deleteMsg').textContent = 'Excluir ' + selected.size + ' item(s)? Esta acao nao pode ser desfeita.';
  document.getElementById('deleteModal').classList.add('show');
  document.getElementById('deleteModal').dataset.mode = 'multi';
}

// Context menu
function showCtx(e, el) {
  const menu = document.getElementById('ctxMenu');
  ctxTarget = { el, path: el.dataset.path, isDir: el.dataset.isdir === 'true', name: el.dataset.name };
  menu.style.left = Math.min(e.clientX, window.innerWidth - 170) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
  menu.classList.add('show');
  const editItem = menu.querySelectorAll('.ctx-menu-item')[2];
  editItem.style.display = (ctxTarget.isDir || !isTextFile(ctxTarget.name)) ? 'none' : '';
}
function hideCtx() { document.getElementById('ctxMenu').classList.remove('show'); }
function ctxOpen() { if (ctxTarget) window.location.href = ctxTarget.path; hideCtx(); }
function ctxRename() {
  if (!ctxTarget) return;
  document.getElementById('renameInput').value = ctxTarget.name;
  document.getElementById('renameOldPath').value = ctxTarget.path;
  document.getElementById('renameModal').classList.add('show');
  document.getElementById('renameInput').focus();
  hideCtx();
}
function ctxEdit() {
  if (!ctxTarget || ctxTarget.isDir) return;
  fetch(ctxTarget.path).then(r => r.text()).then(content => {
    document.getElementById('editContent').value = content;
    document.getElementById('editPath').value = ctxTarget.path;
    document.getElementById('editFileName').textContent = ctxTarget.name;
    document.getElementById('editModal').classList.add('show');
  });
  hideCtx();
}
function ctxDownload() {
  if (ctxTarget) window.location.href = ctxTarget.path + '?download=1';
  hideCtx();
}
function ctxCopyPath() {
  if (ctxTarget) { navigator.clipboard.writeText(ctxTarget.path); toast('Caminho copiado', 'success'); }
  hideCtx();
}
function ctxDelete() {
  if (!ctxTarget) return;
  document.getElementById('deleteMsg').textContent = 'Excluir "' + ctxTarget.name + '"? Esta acao nao pode ser desfeita.';
  document.getElementById('deleteModal').classList.add('show');
  document.getElementById('deleteModal').dataset.mode = 'single';
  document.getElementById('deleteModal').dataset.path = ctxTarget.path;
  hideCtx();
}

// API calls
function doRename() {
  const oldPath = document.getElementById('renameOldPath').value;
  const newName = document.getElementById('renameInput').value.trim();
  if (!newName) return;
  fetch('/api/rename', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ oldPath, newName })
  }).then(r => r.json()).then(d => {
    if (d.ok) location.reload(); else toast(d.error || 'Erro', 'error');
  });
}
function doSave() {
  const p = document.getElementById('editPath').value;
  const content = document.getElementById('editContent').value;
  fetch('/api/edit', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ path: p, content })
  }).then(r => r.json()).then(d => {
    if (d.ok) { closeModal('editModal'); toast('Salvo!', 'success'); }
    else toast(d.error || 'Erro', 'error');
  });
}
function doNewFolder() {
  const name = document.getElementById('newFolderInput').value.trim();
  if (!name) return;
  fetch('/api/mkdir', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ dir: CURRENT_PATH, name })
  }).then(r => r.json()).then(d => {
    if (d.ok) location.reload(); else toast(d.error || 'Erro', 'error');
  });
}
function doDelete() {
  const modal = document.getElementById('deleteModal');
  if (modal.dataset.mode === 'multi') {
    fetch('/api/delete', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ paths: [...selected] })
    }).then(r => r.json()).then(d => { if (d.ok) location.reload(); else toast(d.error, 'error'); });
  } else {
    fetch('/api/delete', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ paths: [modal.dataset.path] })
    }).then(r => r.json()).then(d => { if (d.ok) location.reload(); else toast(d.error, 'error'); });
  }
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function showNewFolder() { document.getElementById('newFolderModal').classList.add('show'); document.getElementById('newFolderInput').focus(); }
function isTextFile(n) { return /\\.(txt|md|json|js|ts|py|sh|css|html|xml|yaml|yml|toml|csv|log|conf|rb|go|rs|java|c|cpp|h|php|sql|env|vue|svelte|jsx|tsx)$/i.test(n); }
function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show ' + (type||'');
  setTimeout(() => t.classList.remove('show'), 2500);
}
</script>
</body></html>`;
}

function buildItemHtml(name, url, isDir, size, mtime, view) {
  const icon = getIcon(name, isDir);
  const sizeStr = isDir ? '' : formatSize(size);
  const dataPath = url;
  const dataIsDir = isDir ? 'true' : 'false';
  const onclick = isDir ? `window.location.href='${dataPath}'` : `toggleSelect(this,'${dataPath.replace(/'/g,"\\'")}')`;

  if (view === 'grid') {
    return `<div class="item" data-path="${dataPath}" data-isdir="${dataIsDir}" data-name="${name}" onclick="${onclick}">
      <div class="check">&#10003;</div>
      <div class="icon">${icon}</div>
      <div class="name" title="${name}">${name}</div>
      <div class="size">${sizeStr}</div>
    </div>`;
  }
  if (view === 'icons') {
    return `<div class="item" data-path="${dataPath}" data-isdir="${dataIsDir}" data-name="${name}" onclick="${onclick}">
      <div class="check">&#10003;</div>
      <div class="icon">${icon}</div>
      <div class="name" title="${name}">${name}</div>
    </div>`;
  }
  // list
  return `<div class="item" data-path="${dataPath}" data-isdir="${dataIsDir}" data-name="${name}">
    <span class="icon" onclick="${onclick}">${icon}</span>
    <span class="name"><a href="${dataPath}">${name}</a></span>
    <span class="size">${sizeStr}</span>
    <span class="date">${mtime}</span>
    <button class="menu-btn" onclick="showCtx(event,this.closest('.item'))">&#8942;</button>
  </div>`;
}

function buildBreadcrumb(relativePath) {
  if (relativePath === '/') return '<a href="/">&#127968;</a>';
  const parts = relativePath.split('/').filter(Boolean);
  let html = '<a href="/">&#127968;</a>';
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    const url = acc.split('/').map(encodeURIComponent).join('/');
    html += ` / <a href="${url}">${p}</a>`;
  }
  return html;
}

function renderLogin(error) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login - Files</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f1a;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh}
.box{background:#1a1a2e;border:1px solid #0f3460;border-radius:8px;padding:30px;width:320px;text-align:center}
.box h2{color:#e94560;margin-bottom:20px}
.box input{width:100%;padding:10px 14px;background:#0f0f1a;border:1px solid #333;border-radius:8px;color:#eee;font-size:15px;margin-bottom:12px;text-align:center}
.box button{width:100%;padding:10px;background:#e94560;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer}
.box button:hover{opacity:.85}
.err{color:#f44336;font-size:13px;margin-bottom:8px}
</style></head><body>
<div class="box"><h2>&#128274; Acesso</h2>
${error ? '<div class="err">'+error+'</div>' : ''}
<form method="POST" action="/api/auth"><input type="password" name="password" placeholder="Senha" autofocus>
<button type="submit">Entrar</button></form></div>
</body></html>`;
}

// --- Server ---
const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, 'http://localhost');
  const urlPath = decodeURIComponent(urlObj.pathname);
  const fullPath = path.join(ROOT, urlPath === '/' ? '' : urlPath);

  // Auth check
  if (req.method === 'GET' && urlPath === '/api/auth') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(renderLogin());
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/auth') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      const pass = body.match(/password=([^&]*)/)?.[1];
      if (PASSWORD && pass === PASSWORD) {
        const token = createSession();
        res.writeHead(302, {'Set-Cookie': `session=${token}; Path=/; HttpOnly`, 'Location': '/'});
        res.end();
      } else {
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.end(renderLogin('Senha incorreta'));
      }
    });
    return;
  }

  // Cookie auth
  const cookies = parseCookies(req);
  if (PASSWORD && !isValidSession(cookies.session) && !urlPath.startsWith('/api/auth')) {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        res.writeHead(401, {'Content-Type':'application/json'});
        res.end('{"error":"unauthorized"}');
      });
      return;
    }
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(renderLogin());
    return;
  }

  // Security
  if (!fullPath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }

  // API: System info
  if (urlPath === '/api/system') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ storage: getStorageInfo(), battery: getBatteryInfo(), memory: getMemoryInfo() }));
    return;
  }

  // API: Rename
  if (req.method === 'POST' && urlPath === '/api/rename') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { oldPath, newName } = JSON.parse(body);
        const oldFull = path.join(ROOT, oldPath);
        const dir = path.dirname(oldFull);
        const newFull = path.join(dir, newName);
        if (!oldFull.startsWith(ROOT) || !newFull.startsWith(ROOT)) throw new Error('Invalid path');
        fs.renameSync(oldFull, newFull);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Delete
  if (req.method === 'POST' && urlPath === '/api/delete') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { paths } = JSON.parse(body);
        for (const p of paths) {
          const fp = path.join(ROOT, p);
          if (!fp.startsWith(ROOT)) continue;
          const stat = fs.statSync(fp);
          if (stat.isDirectory()) fs.rmSync(fp, { recursive: true });
          else fs.unlinkSync(fp);
        }
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Mkdir
  if (req.method === 'POST' && urlPath === '/api/mkdir') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { dir, name } = JSON.parse(body);
        const full = path.join(ROOT, dir, name);
        if (!full.startsWith(ROOT)) throw new Error('Invalid path');
        fs.mkdirSync(full, { recursive: true });
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Edit
  if (req.method === 'POST' && urlPath === '/api/edit') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { path: filePath, content } = JSON.parse(body);
        const fp = path.join(ROOT, filePath);
        if (!fp.startsWith(ROOT)) throw new Error('Invalid path');
        fs.writeFileSync(fp, content, 'utf8');
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: Upload
  if (req.method === 'POST' && urlPath === '/api/upload') {
    parseMultipart(req, (err, parts) => {
      if (err) { res.writeHead(400); res.end('Bad request'); return; }
      try {
        const dir = parts.find(p => p.name === 'dir')?.data?.toString() || '/';
        for (const part of parts) {
          if (part.filename) {
            const saveDir = path.join(ROOT, dir);
            if (!saveDir.startsWith(ROOT)) continue;
            const savePath = path.join(saveDir, part.filename);
            fs.writeFileSync(savePath, part.data);
          }
        }
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: ZIP download
  if (urlPath === '/api/zip') {
    const pathsParam = urlObj.searchParams.get('paths') || '';
    const dirParam = urlObj.searchParams.get('dir') || '/';
    const paths = pathsParam.split(',').filter(Boolean);
    if (!paths.length) { res.writeHead(400); res.end('No paths'); return; }
    const zipName = 'download_' + Date.now() + '.zip';
    const zipPath = path.join('/tmp', zipName);
    try {
      const absPaths = paths.map(p => path.join(ROOT, decodeURIComponent(p))).filter(p => p.startsWith(ROOT));
      const cmd = `cd "${ROOT}" && zip -r "${zipPath}" ${absPaths.map(p => '"' + p.replace(ROOT+'/', '') + '"').join(' ')} 2>/dev/null`;
      execSync(cmd, { timeout: 60000 });
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
      });
      fs.createReadStream(zipPath).pipe(res).on('finish', () => { try { fs.unlinkSync(zipPath); } catch {} });
    } catch (e) {
      res.writeHead(500); res.end('Error creating zip');
      try { fs.unlinkSync(zipPath); } catch {}
    }
    return;
  }

  // Serve files / directories
  try {
    const stat = fs.statSync(fullPath);
    // Download single file
    if (stat.isFile() && urlObj.searchParams.get('download') === '1') {
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[path.extname(fullPath).toLowerCase()] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(fullPath)}"`,
      });
      fs.createReadStream(fullPath).pipe(res);
      return;
    }
    if (stat.isDirectory()) {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end(renderPage(fullPath, urlPath, Object.fromEntries(urlObj.searchParams)));
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      const ct = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {'Content-Type': ct});
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (e) {
    res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#0f0f1a;color:#eee;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center">
<h1 style="color:#e94560">404</h1><p style="color:#aaa;margin:10px 0">${e.message}</p><a href="/" style="color:#53a8ff">Voltar</a></body></html>`);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  \x1b[36m╔══════════════════════════════════════╗\x1b[0m`);
  console.log(`  \x1b[36m║\x1b[0m  \x1b[1mSimple File Server\x1b[0m                  \x1b[36m║\x1b[0m`);
  console.log(`  \x1b[36m╠══════════════════════════════════════╣\x1b[0m`);
  console.log(`  \x1b[36m║\x1b[0m  URL: \x1b[32mhttp://0.0.0.0:${PORT}\x1b[0m              \x1b[36m║\x1b[0m`);
  console.log(`  \x1b[36m║\x1b[0m  Root: \x1b[33m${ROOT}\x1b[0m  \x1b[36m║\x1b[0m`);
  console.log(`  \x1b[36m║\x1b[0m  Auth: ${PASSWORD ? '\x1b[32mEnabled\x1b[0m' : '\x1b[31mDisabled\x1b[0m'}                      \x1b[36m║\x1b[0m`);
  console.log(`  \x1b[36m╚══════════════════════════════════════╝\x1b[0m\n`);
});
