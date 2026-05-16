import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import { connectPtyWebSocket } from '../api/hermes';
import { Search, Terminal as TerminalIcon, Send, ChevronDown, RefreshCw } from 'lucide-react';

interface Props {
  sessionId: string | null;
  onSelectSession?: (id: string) => void;
}

export default function ChatTerminal({ sessionId }: Props) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [slashMode, setSlashMode] = useState(false);
  const [slashSuggestions, setSlashSuggestions] = useState<string[]>([]);

  const allSlashCommands = [
    '/help', '/model', '/new', '/reset', '/retry', '/undo', '/title',
    '/compress', '/stop', '/rollback', '/config', '/personality',
    '/reasoning', '/verbose', '/voice', '/yolo', '/skill', '/skills',
    '/reload-skills', '/reload', '/reload-mcp', '/cron', '/curator',
    '/tools', '/toolsets', '/plugins', '/gateway', '/platforms',
    '/approve', '/deny', '/restart', '/sethome', '/topic', '/agents',
    '/tasks', '/goal', '/history', '/save', '/quit', '/exit',
  ];

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontFamily: "'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#0a0a0b',
        foreground: '#e8e8ea',
        cursor: '#6c5ce7',
        selectionBackground: '#3a3a4e',
        black: '#0a0a0b',
        red: '#ff5252',
        green: '#00e676',
        yellow: '#ffd54f',
        blue: '#448aff',
        magenta: '#7c4dff',
        cyan: '#18ffff',
        white: '#e8e8ea',
        brightBlack: '#6b6b73',
        brightRed: '#ff5252',
        brightGreen: '#69f0ae',
        brightYellow: '#ffd740',
        brightBlue: '#448aff',
        brightMagenta: '#7c4dff',
        brightCyan: '#18ffff',
        brightWhite: '#f5f5f5',
      },
      allowTransparency: true,
      allowProposedApi: true,
      cols: 80,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Write welcome message
    term.writeln('\x1b[35m◆ Hermes Claude\x1b[0m — AI Agent Terminal');
    term.writeln('\x1b[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[2mType \x1b[35m/help\x1b[0m\x1b[2m for available commands, or start chatting!\x1b[0m');

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // Fit terminal on resize
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);
    // Fit after a short delay to let the DOM settle
    const tid = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(tid);
    };
  }, []);

  // Connect to WebSocket PTY when sessionId changes
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    // Close previous connection
    wsRef.current?.close();

    try {
      const ws = connectPtyWebSocket();
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        term.writeln('\x1b[32m✓ Connected to Hermes agent\x1b[0m');
        if (sessionId) {
          ws.send(JSON.stringify({ type: 'resume', session_id: sessionId }));
          term.writeln(`\x1b[2mResuming session: ${sessionId.slice(0, 8)}...\x1b[0m`);
        }
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          // Check if it's a JSON control message
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'output') {
              term.write(msg.data);
            } else if (msg.type === 'status') {
              term.writeln(`\x1b[2m${msg.message}\x1b[0m`);
            }
          } catch {
            // Plain text - write to terminal
            term.write(event.data);
          }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        term.writeln('\x1b[33m! Disconnected from Hermes agent\x1b[0m');
      };

      ws.onerror = () => {
        term.writeln('\x1b[31m✗ WebSocket connection error\x1b[0m');
        term.writeln('\x1b[2mMake sure Hermes Dashboard is running: \x1b[35mhermes dashboard\x1b[0m');
      };
    } catch (e) {
      term.writeln(`\x1b[31m✗ Failed to connect: ${(e as Error).message}\x1b[0m`);
    }

    return () => {
      wsRef.current?.close();
    };
  }, [sessionId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputRef.current) {
      const value = inputRef.current.value.trim();
      if (!value) return;

      // Send to WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(value + '\n');
        xtermRef.current?.writeln(`\x1b[90m> \x1b[0m${value}`);
      } else {
        xtermRef.current?.writeln(`\x1b[31m! Not connected. Type to terminal directly.\x1b[0m`);
        // Write directly to terminal as fallback
        xtermRef.current?.writeln(`\x1b[90m> \x1b[0m${value}`);
      }

      inputRef.current.value = '';
      setSlashMode(false);
      setSlashSuggestions([]);
    } else if (e.key === 'Tab' && slashSuggestions.length > 0 && inputRef.current) {
      e.preventDefault();
      inputRef.current.value = slashSuggestions[0] + ' ';
      setSlashMode(false);
      setSlashSuggestions([]);
    }
  }, [slashSuggestions]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.startsWith('/') && !value.includes(' ')) {
      setSlashMode(true);
      const q = value.toLowerCase();
      const matches = allSlashCommands.filter((cmd) => cmd.startsWith(q));
      setSlashSuggestions(matches.slice(0, 6));
    } else {
      setSlashMode(false);
      setSlashSuggestions([]);
    }
  }, []);

  const handleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      searchAddonRef.current?.findNext(searchQuery);
    }
  };

  const handleSendMessage = () => {
    if (inputRef.current) {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      inputRef.current.dispatchEvent(event);
      // Fallback: directly trigger
      if (inputRef.current.value.trim()) {
        const value = inputRef.current.value.trim();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(value + '\n');
          xtermRef.current?.writeln(`\x1b[90m> \x1b[0m${value}`);
        }
        inputRef.current.value = '';
        setSlashMode(false);
      }
    }
  };

  const handleReconnect = () => {
    xtermRef.current?.writeln('\x1b[2mReconnecting...\x1b[0m');
    wsRef.current?.close();
    const ws = connectPtyWebSocket();
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      xtermRef.current?.writeln('\x1b[32m✓ Reconnected\x1b[0m');
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Top bar */}
      <div className="topbar">
        <button className="btn-icon" onClick={handleReconnect} title="Reconnect">
          <RefreshCw size={13} />
        </button>
        <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <div className="breadcrumb" style={{ marginLeft: 'auto' }}>
          <span>Hermes</span> / <span>Chat</span>
          {sessionId && <> / <span style={{ color: 'var(--text-muted)' }}>{sessionId.slice(0, 8)}...</span></>}
        </div>
        <button className="btn-icon" onClick={handleSearch} title="Search terminal">
          <Search size={13} />
        </button>
      </div>

      {/* Terminal area */}
      <div className="terminal-container" ref={terminalRef} />

      {/* Search bar (when open) */}
      {searchOpen && (
        <div
          style={{
            padding: '6px 12px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Search size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search terminal output..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchAddonRef.current?.findNext(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  searchAddonRef.current?.findPrevious(searchQuery);
                } else {
                  searchAddonRef.current?.findNext(searchQuery);
                }
              }
            }}
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: 12,
              outline: 'none',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <button className="btn-icon" onClick={() => searchAddonRef.current?.findPrevious(searchQuery)} title="Previous">
            <ChevronDown size={13} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="btn-icon" onClick={() => searchAddonRef.current?.findNext(searchQuery)} title="Next">
            <ChevronDown size={13} />
          </button>
          <button className="btn-icon" onClick={() => setSearchOpen(false)} title="Close search">
            ✕
          </button>
        </div>
      )}

      {/* Slash command suggestions */}
      {slashMode && slashSuggestions.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-tertiary)',
            maxHeight: 160,
            overflow: 'auto',
          }}
        >
          {slashSuggestions.map((cmd) => (
            <div
              key={cmd}
              style={{
                padding: '4px 16px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                if (inputRef.current) {
                  inputRef.current.value = cmd + ' ';
                  inputRef.current.focus();
                  setSlashMode(false);
                  setSlashSuggestions([]);
                }
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <TerminalIcon size={11} style={{ color: 'var(--accent)' }} />
              <code style={{ color: 'var(--accent)' }}>{cmd}</code>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="input-bar">
        <TerminalIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder={
            connected
              ? 'Type a message or /command... (Tab to autocomplete)'
              : 'Terminal offline — type to queue messages...'
          }
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          autoFocus
        />
        <button className="btn-icon" onClick={handleSendMessage} title="Send" style={{ color: connected ? 'var(--accent)' : 'var(--text-muted)' }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
