import express from 'express';
import cors from 'cors';
import http from 'http';
import { spawn } from 'child_process';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERMES_BIN = '/Users/samueljason/.hermes/hermes-agent/venv/bin/hermes';
const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

// ─── CHAT MODE: POST /api/chat — SSE stream from `hermes -z` ───
app.post('/api/chat', (req, res) => {
  const { message, session_id } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const args = ['-z', message];
  if (session_id) args.push('--resume', session_id);

  const proc = spawn(HERMES_BIN, args, {
    env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let buffer = '';

  proc.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    buffer += text;
    res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
  });

  proc.on('close', (code) => {
    // If buffer has content, send it as chunk + done
    if (buffer.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'done', exit_code: code })}\n\n`);
    } else {
      // No data — probably an error
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'No output from Hermes' })}\n\n`);
    }
    res.end();
  });

  proc.on('error', (err) => {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  });
});

// ─── DASHBOARD PROXY ───
const HERMES_DASHBOARD = 'http://127.0.0.1:9119';
let dashboardToken = null;

async function fetchDashboardToken() {
  try {
    const res = await fetch(HERMES_DASHBOARD);
    const html = await res.text();
    const m = html.match(/window\.__HERMES_SESSION_TOKEN__\s*=\s*"([^"]+)"/);
    if (m?.[1]) { dashboardToken = m[1]; return true; }
    return false;
  } catch { return false; }
}

app.all('/api/hermes/*', async (req, res) => {
  if (!dashboardToken && !(await fetchDashboardToken())) {
    return res.status(502).json({ error: 'Hermes Dashboard not running' });
  }

  const targetPath = '/api' + req.path.replace('/api/hermes', '');
  const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const url = new URL(targetPath + qs, HERMES_DASHBOARD);

  const headers = {
    'host': '127.0.0.1:9119',
    'x-hermes-session-token': dashboardToken,
    'accept': 'application/json',
  };
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ? JSON.stringify(req.body) : undefined;
  if (body) headers['content-length'] = Buffer.byteLength(body).toString();

  try {
    const proxyRes = await fetch(url.toString(), { method: req.method, headers, body });
    const data = await proxyRes.text();
    res.status(proxyRes.status).set(Object.fromEntries(proxyRes.headers)).send(data);
  } catch (e) {
    res.status(502).json({ error: 'Proxy error', detail: e.message });
  }
});

// ─── WEB SOCKET PTY (hermes --tui via node-pty) ───
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/pty' });

wss.on('connection', async (ws) => {
  try {
    const { spawn } = await import('node-pty');
    const pty = spawn(HERMES_BIN, ['--tui'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: process.env.HOME,
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    pty.onData((data) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'data', text: data }));
    });

    pty.onExit(({ exitCode, signal }) => {
      ws.send(JSON.stringify({ type: 'exit', code: exitCode, signal }));
      ws.close();
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'input') pty.write(msg.text);
        else if (msg.type === 'resize') pty.resize(msg.cols || 120, msg.rows || 40);
      } catch { pty.write(raw.toString()); }
    });

    ws.on('close', () => pty.kill());
    ws.on('error', () => pty.kill());

  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', message: `PTY failed: ${err.message}` }));
    ws.close();
  }
});

// ─── STATIC FILES ───
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// ─── HEALTH ───
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', port: PORT, dashboard: dashboardToken ? 'connected' : 'not available' });
});

// ─── SPA CATCH-ALL ───
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── START ───
server.listen(PORT, async () => {
  console.log(`╭─ Hermes Claude Backend ─────────────────╮`);
  console.log(`│  🚀  http://localhost:${PORT}               │`);
  console.log(`│  💬  POST /api/chat  → hermes -z          │`);
  console.log(`│  💻  WS  /api/pty    → hermes --tui        │`);
  console.log(`│  📡  /api/hermes/*   → Dashboard proxy     │`);
  console.log(`╰───────────────────────────────────────────╯`);

  const tokenOk = await fetchDashboardToken();
  console.log(`  Dashboard: ${tokenOk ? '✓ connected' : '✗ not running'}`);
});
