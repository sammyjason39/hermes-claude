import { useState } from 'react';
import {
  Terminal,
  PanelLeftOpen,
  PanelLeftClose,
  Database,
  Clock,
  Cable,
  Puzzle,
  Settings,
} from 'lucide-react';
import SessionList from './SessionList';
import Connectors from './Connectors';
import CronJobs from './CronJobs';
import SkillsPanel from './SkillsPanel';
import ConfigPanel from './ConfigPanel';
import ChatTerminal from './ChatTerminal';

type View = 'chat' | 'sessions' | 'connectors' | 'cron' | 'skills' | 'config';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>('chat');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const navItems = [
    { id: 'chat' as View, label: 'Chat', icon: Terminal },
    { id: 'sessions' as View, label: 'Sessions', icon: Database },
    { id: 'connectors' as View, label: 'Connectors', icon: Cable },
    { id: 'cron' as View, label: 'Cron Jobs', icon: Clock },
    { id: 'skills' as View, label: 'Skills', icon: Puzzle },
    { id: 'config' as View, label: 'Config', icon: Settings },
  ];

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setView('chat');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      {sidebarOpen && (
        <div className="sidebar">
          <div className="sidebar-header">
            <span style={{ color: 'var(--accent)' }}>◆</span>
            Hermes Claude
            <button
              className="btn-icon"
              onClick={() => setSidebarOpen(false)}
              style={{ marginLeft: 'auto' }}
              title="Close sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>

          {/* Navigation */}
          <div style={{ padding: '4px 0' }}>
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`sidebar-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <item.icon size={14} className="icon" />
                {item.label}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 12px' }} />

          {/* View-specific content in sidebar */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {view === 'sessions' && (
              <SessionList onSelectSession={handleSelectSession} />
            )}
            {view === 'connectors' && <Connectors />}
            {view === 'cron' && <CronJobs />}
            {view === 'skills' && <SkillsPanel />}
            {view === 'config' && <ConfigPanel />}
          </div>

          {/* Bottom status bar */}
          <div
            style={{
              padding: '6px 16px',
              borderTop: '1px solid var(--border-color)',
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Hermes v2.x
          </div>
        </div>
      )}

      {/* Sidebar toggle button when closed */}
      {!sidebarOpen && (
        <button
          className="btn-icon"
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed',
            left: 8,
            top: 8,
            zIndex: 100,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: 6,
          }}
          title="Open sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Main Area */}
      <div className="main-area">
        <ChatTerminal sessionId={selectedSessionId} onSelectSession={handleSelectSession} />
      </div>
    </div>
  );
}
