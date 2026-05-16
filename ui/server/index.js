import express from 'express';
import cors from 'cors';
import http from 'http';

const HERMES = 'http://127.0.0.1:9119';
const PORT = 3001;
const ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

// --- Token cache ---
let token = null;

async function fetchToken() {
  try {
    const res = await fetch(HERMES);
    const html = await res.text();
    const m = html.match(/window\.__HERMES_SESSION_TOKEN__\s*=\s*"([^"]+)"/);
    if (m?.[1]) { token = m[1]; return token; }
    console.error('Could not extract session token');
    return null;
  } catch (e) {
    console.error('Token fetch error:', e.message);
    return null;
  }
}

// --- Raw HTTP proxy (no middleware) ---
function proxyTo(targetPath, req, res, method = req.method) {
  const url = new URL(targetPath, HERMES);
  const headers = { ...req.headers, host: '127.0.0.1:9119' };
  delete headers['connection'];
  if (token) headers['x-hermes-session-token'] = token;

  const proxyReq = http.request(
    {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (e) => {
    res.status(502).json({ error: 'Proxy error', detail: e.message });
  });
  if (['POST', 'PUT', 'PATCH'].includes(method)) req.pipe(proxyReq);
  else proxyReq.end();
}

// --- Express app ---
const app = express();
app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- REST Proxy: /api/hermes/* → /api/* ---
const PROXY_MAP = {
  'GET /status': '/api/status',
  'GET /sessions': '/api/sessions',
  'GET /sessions/:id/messages': '/api/sessions/:id/messages',
  'DELETE /sessions/:id': '/api/sessions/:id',
  'GET /cron': '/api/cron/jobs',
  'GET /cron/jobs': '/api/cron/jobs',
  'POST /cron/:id/pause': '/api/cron/:id/pause',
  'POST /cron/:id/resume': '/api/cron/:id/resume',
  'POST /cron/:id/trigger': '/api/cron/:id/trigger',
  'DELETE /cron/:id': '/api/cron/:id',
  'GET /config': '/api/config',
  'PUT /config': '/api/config',
  'GET /env': '/api/env',
  'PUT /env': '/api/env',
  'DELETE /env': '/api/env',
  'GET /skills': '/api/skills',
  'GET /profiles': '/api/profiles',
  'GET /model/info': '/api/model/info',
  'GET /model/options': '/api/model/options',
  'GET /model/auxiliary': '/api/model/auxiliary',
  'GET /logs': '/api/logs',
};

for (const [route, target] of Object.entries(PROXY_MAP)) {
  const [method, path] = [route.split(' ')[0].toLowerCase(), route.substring(route.indexOf(' ') + 1)];
  app[method](`/api/hermes${path}`, (req, res) => {
    let t = target;
    for (const [k, v] of Object.entries(req.params)) t = t.replace(`:${k}`, v);
    const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    proxyTo(t + qs, req, res);
  });
}

// GET /api/hermes/token
app.get('/api/hermes/token', async (_req, res) => {
  const t = await fetchToken();
  if (t) res.json({ token: t });
  else res.status(502).json({ error: 'Failed to fetch token' });
});

// Catch-all proxy for /api/hermes/* routes
app.use('/api/hermes', (req, res) => {
  const target = `/api${req.path}`;
  proxyTo(target + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''), req, res);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', port: PORT, target: HERMES });
});

// --- HTTP server ---
const server = http.createServer(app);

// --- WebSocket proxy for /api/pty ---
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/api/pty') { socket.destroy(); return; }

  const proxyReq = http.request({
    hostname: '127.0.0.1', port: 9119,
    path: '/api/pty',
    method: 'GET',
    headers: {
      ...req.headers,
      host: '127.0.0.1:9119',
      'x-hermes-session-token': token || '',
      connection: 'upgrade',
      upgrade: 'websocket',
    },
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    const acceptKey = proxyRes.headers['sec-websocket-accept'] || '';
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
      '\r\n'
    );
    socket.pipe(proxySocket).pipe(socket);
  });

  proxyReq.on('error', (e) => { console.error('WS proxy error:', e.message); socket.destroy(); });
  proxyReq.end();
});

// --- Start ---
server.listen(PORT, async () => {
  console.log(`◆ Hermes Claude Proxy running on http://localhost:${PORT}`);
  console.log(`  Proxying → ${HERMES}`);
  const t = await fetchToken();
  if (t) console.log(`  Token: ✓ (${t.substring(0, 16)}...)`);
  else console.warn('  Token: ✗ - start hermes dashboard first');
  setInterval(fetchToken, 30000);
});
