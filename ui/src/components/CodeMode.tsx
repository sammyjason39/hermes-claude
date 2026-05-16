import { useState } from 'react';
import {
  Database, Clock, Cable, Puzzle, Settings,
  PanelLeftOpen, PanelLeftClose, Plus,
} from 'lucide-react';
import SessionList from './SessionList';
import Connectors from './Connectors';
import CronJobs from './CronJobs';
import SkillsPanel from './SkillsPanel';
import ConfigPanel from './ConfigPanel';
import ChatTerminal from './ChatTerminal';

type View = 'sessions' | 'connectors' | 'cron' | 'skills' | 'config';

export default function CodeMode() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
            <span>Sessions</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="code-new-session-btn">
                <Plus size={12} style={{ marginRight: 2 }} /> New
              </button>
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
            background: 'var(--code-surface)', border: '1px solid var(--code-border)',
            padding: 6,
          }}
        >
          <PanelLeftOpen size={14} />
        </button>
      )}

      {/* Main Terminal Area */}
      <div className="code-main">
        <ChatTerminal sessionId={selectedSessionId} />
      </div>
    </div>
  );
}
