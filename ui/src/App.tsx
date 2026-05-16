import { useState } from 'react';
import ChatMode from './components/ChatMode';
import CodeMode from './components/CodeMode';
import { MessageSquare, Terminal } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'chat' | 'code'>('code');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Claude-style top bar */}
      <div className="claude-topbar">
        <div className="claude-topbar-left">
          <span className="claude-logo">✦</span>
          <span className="claude-brand">Hermes Claude</span>
        </div>
        <div className="claude-mode-switcher">
          <button
            className={`claude-mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            className={`claude-mode-btn ${mode === 'code' ? 'active' : ''}`}
            onClick={() => setMode('code')}
          >
            <Terminal size={14} />
            Code
          </button>
        </div>
        <div className="claude-topbar-right">
          <span className="claude-status-dot" />
          <span className="claude-status-text">Connected</span>
        </div>
      </div>

      {/* Mode content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'chat' ? <ChatMode /> : <CodeMode />}
      </div>
    </div>
  );
}
