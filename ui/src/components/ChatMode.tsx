import { useState, useEffect } from 'react';
import { getSessions, timeAgo } from '../api/hermes';
import type { SessionSummary } from '../types/hermes';
import { Search, Send, Plus, MessageSquare, Cable, Clock, Puzzle } from 'lucide-react';
import Connectors from './Connectors';
import CronJobs from './CronJobs';
import SkillsPanel from './SkillsPanel';

type View = 'conversations' | 'connectors' | 'cron' | 'skills';

export default function ChatMode() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<View>('conversations');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    { role: 'assistant', content: 'Hello! I\'m Hermes Claude. How can I help you today?' }
  ]);

  useEffect(() => {
    getSessions(0, 50).then(setSessions).catch(() => {});
  }, []);

  const filteredSessions = sessions.filter(s =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: 'conversations' as View, label: 'Conversations', icon: MessageSquare },
    { id: 'connectors' as View, label: 'Connectors', icon: Cable },
    { id: 'cron' as View, label: 'Jobs', icon: Clock },
    { id: 'skills' as View, label: 'Skills', icon: Puzzle },
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputValue('');

    // Simulate assistant response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `You said: "${text}". Responses will flow through Hermes WebSocket when connected.`
      }]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-mode-wrapper">
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span>Hermes</span>
          <button className="chat-new-btn">
            <Plus size={13} style={{ marginRight: 2 }} /> New
          </button>
        </div>

        {/* Navigation */}
        {navItems.map(item => (
          <div
            key={item.id}
            className={`chat-sidebar-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <item.icon size={14} className="icon" style={{ width: 14, height: 14, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--chat-border)', margin: '8px 12px' }} />

        {/* View content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {view === 'conversations' && (
            <>
              <div className="chat-sidebar-search">
                <Search size={13} style={{ position: 'absolute', left: 22, top: 14, color: 'var(--chat-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              {filteredSessions.map(s => (
                <div
                  key={s.session_id}
                  className={`chat-conv-item ${activeSession === s.session_id ? 'active' : ''}`}
                  onClick={() => setActiveSession(s.session_id)}
                >
                  <div className="chat-conv-title">{s.title || 'Untitled conversation'}</div>
                  <div className="chat-conv-meta">
                    <span>{timeAgo(s.last_activity)}</span>
                    <span>·</span>
                    <span>{s.model?.split('/').pop()}</span>
                    <span>·</span>
                    <span>{s.message_count} msgs</span>
                  </div>
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div style={{ padding: 16, color: 'var(--chat-text-muted)', textAlign: 'center', fontSize: 12 }}>
                  No conversations yet
                </div>
              )}
            </>
          )}
          {view === 'connectors' && <Connectors chatMode />}
          {view === 'cron' && <CronJobs chatMode />}
          {view === 'skills' && <SkillsPanel chatMode />}
        </div>
      </div>

      {/* Chat Main */}
      <div className="chat-main">
        <div className="chat-messages">
          <div className="chat-messages-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className={`chat-avatar ${msg.role}`}>
                  {msg.role === 'assistant' ? '✦' : 'U'}
                </div>
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="Message Hermes Claude..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="chat-input-send" onClick={handleSend}>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
