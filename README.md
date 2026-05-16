# ◆ Hermes Claude

> Claude Code-inspired UI for **Hermes Agent** — with **BMad** methodology and **Termul** terminal integration.

![Hermes](https://img.shields.io/badge/Hermes-6c5ce7?style=flat) ![BMad](https://img.shields.io/badge/BMad-ff6b6b?style=flat) ![React](https://img.shields.io/badge/React-61dafb?style=flat) ![xterm.js](https://img.shields.io/badge/xterm.js-000?style=flat)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🤖 Chat Terminal** | Full xterm.js terminal with Hermes PTY WebSocket connection |
| **📋 Sessions** | Browse, search, and resume past agent sessions |
| **📡 Connectors** | View gateway platform status (Telegram, Discord, etc.) |
| **⏰ Cron Jobs** | List, pause, resume, trigger, and delete scheduled tasks |
| **🧩 Skills** | Browse installed skills with `/command` reference |
| **⚙️ Config** | View live Hermes configuration |
| **🎯 BMad** | BMad agile AI-development methodology integrated |
| **💻 Termul** | Terminal emulator integration ready (Tauri desktop app) |

## 🚀 Quick Start

### Prerequisites

- **Hermes Agent** installed and configured
- Node.js 18+
- Hermes Dashboard running (`hermes dashboard --no-open`)

### 1. Start Hermes Dashboard

```bash
hermes dashboard --no-open
```

### 2. Start Hermes Claude

```bash
cd ~/hermes-claude
./start.sh
```

This starts:
- **Backend proxy** (port 3001) — connects to Hermes Dashboard API
- **Frontend** (port 5173) — the Claude Code-style UI

Open **http://localhost:5173** in your browser.

### Or start manually

```bash
# Terminal 1: Backend proxy
cd ~/hermes-claude/ui/server && node index.js

# Terminal 2: Frontend
cd ~/hermes-claude/ui && npx vite
```

## 🧭 Architecture

```
hermes-claude/
├── _bmad/                    # BMad methodology framework
├── .claude/                  # Claude Code skills (from BMad)
├── docs/                     # Project documentation
├── ui/                       # React frontend
│   ├── src/
│   │   ├── api/hermes.ts     # Hermes Dashboard API client
│   │   ├── types/hermes.ts   # TypeScript types
│   │   └── components/
│   │       ├── Layout.tsx       # Main layout (sidebar + terminal)
│   │       ├── ChatTerminal.tsx # xterm.js terminal with Hermes PTY
│   │       ├── SessionList.tsx  # Session browser/search
│   │       ├── Connectors.tsx   # Platform connector status
│   │       ├── CronJobs.tsx     # Cron job management
│   │       ├── SkillsPanel.tsx  # Skills browser
│   │       └── ConfigPanel.tsx  # Config viewer
│   ├── server/
│   │   └── index.js          # Express proxy → Hermes Dashboard API
│   └── package.json
├── start.sh                  # One-click startup
└── README.md
```

### Data Flow

```
Your Browser (:5173)
    │
    ├─ REST API → Hermes Claude Proxy (:3001) → Hermes Dashboard (:9119)
    │
    └─ WebSocket PTY → Hermes Claude Proxy (:3001) → Hermes Dashboard PTY (:9119)
```

## 🔌 API Endpoints (Proxy)

| Route | Description |
|-------|-------------|
| `GET /api/hermes/token` | Get Hermes session token |
| `GET /api/hermes/status` | Agent + gateway status |
| `GET /api/hermes/sessions` | List sessions (query params work) |
| `GET /api/hermes/sessions/:id/messages` | Session messages |
| `DELETE /api/hermes/sessions/:id` | Delete session |
| `GET /api/hermes/cron` | List cron jobs |
| `GET /api/hermes/config` | Get configuration |
| `GET /api/hermes/env` | List env vars |
| `GET /api/hermes/skills` | List skills |
| `GET /api/hermes/connectors` | Platform connector status |
| `WS /api/pty` | Terminal WebSocket |

## 💻 Termul Integration

[**Termul**](https://github.com/gnoviawan/termul) — Terminal Ultimate Manager — is a Tauri + React desktop app with:

- Workspace-based terminal management
- Split panes & tabbed interface
- Built-in code & markdown editor
- Embedded browser tabs

**To integrate:** The xterm.js component in `ChatTerminal.tsx` can be extracted and embedded into Termul as a custom panel. The Hermes Claude backend proxy runs independently and can serve multiple Termul instances.

## 🎯 BMad Integration

[**BMad Method**](https://github.com/bmad-code-org/BMAD-METHOD) (v6.6.0) is installed in `_bmad/` with:

- Core framework (BMM module) — 34+ agile AI-driven development workflows
- Skills in `.claude/skills/` — 42 BMad skills for various workflows
- Config at `_bmad/config.toml` and `_bmad/config.user.toml`

**Usage:** BMad skills are accessible via `/skill bmad-*` commands in the Hermes terminal.

## ⌨️ Slash Commands

In the chat terminal, type `/` to see available commands:

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/model` | Change model |
| `/skill <name>` | Load a skill |
| `/new`, `/reset` | Fresh session |
| `/cron` | Manage cron jobs |
| `/platforms` | Show platform status |
| `/config` | Show configuration |
| `/tools` | Manage tools |
| And 30+ more... | |

## 🛠️ Development

```bash
cd ~/hermes-claude/ui

# Start in dev mode
npm run dev

# Build for production
npm run build

# Preview production build
npx vite preview
```

## 📝 License

MIT — Built for ConextLab Technology
