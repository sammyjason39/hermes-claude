import { useState } from 'react';
import {
  Database, Clock, Cable, Puzzle, Settings,
  PanelLeftOpen, PanelLeftClose, ExternalLink,
} from 'lucide-react';
import SessionList from './SessionList';
import Connectors from './Connectors';
import CronJobs from './CronJobs';
import SkillsPanel from './SkillsPanel';
import ConfigPanel from './ConfigPanel';

const TERMUL_URL = 'http://localhost:8080';

type View = 'sessions' | 'connectors' | 'cron' | 'skills' | 'config';

export default function CodeMode() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<View>('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
  };

  const navItems = [
    { id: 'sessions' as View, label: 'Sessions', icon: Database },
    { id: 'connectors' as View, label: 'Connectors', icon: Cable },
    { id: 'cron' as View, label: 'Cron', icon: Clock },
    { id: 'skills' as View, label: 'Skills', icon: Puzzle },
    { id: 'config' as View, label: 'Config', icon: Settings },
  ];

  return (
    <div className="code-mode-wrapper">
      {/* Code Sidebar */}
      {sidebarOpen && (
        <div className="code-sidebar">
          <div className="code-sidebar-header">
            <span>Hermes</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-icon" onClick={() => setSidebarOpen(false)} title="Close sidebar">
                <PanelLeftClose size={14} />
              </button>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="code-sidebar-tabs">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`code-sidebar-tab ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* View content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {view === 'sessions' && <SessionList onSelectSession={handleSelectSession} codeMode />}
            {view === 'connectors' && <Connectors codeMode />}
            {view === 'cron' && <CronJobs codeMode />}
            {view === 'skills' && <SkillsPanel codeMode />}
            {view === 'config' && <ConfigPanel codeMode />}
          </div>
        </div>
      )}

      {/* Toggle sidebar when closed */}
      {!sidebarOpen && (
        <button
          className="btn-icon"
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed', left: 8, top: 52, zIndex: 100,
            background: 'var(--surface)', border: '1px solid var(--border)',
            padding: 6,
          }}
        >
          <PanelLeftOpen size={14} />
        </button>
      )}

      {/* Main: Termul iframe */}
      <div className="code-main">
        <div className="code-toolbar">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            Termul — Terminal Manager
          </span>
          <a
            href={TERMUL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="code-toolbar-tab"
            style={{ marginLeft: 'auto', textDecoration: 'none' }}
          >
            <ExternalLink size={12} />
            Open in new tab
          </a>
        </div>
        <iframe
          src={TERMUL_URL}
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            background: '#000',
          }}
          title="Termul"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
