import { useState, useEffect, useRef } from 'react';
import { getSessions, timeAgo } from '../api/hermes';
import type { SessionSummary } from '../types/hermes';
import { Search, Send, Plus, MessageSquare, Cable, Clock, Puzzle, Zap } from 'lucide-react';
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
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSessions(0, 50).then(setSessions).catch(() => {});
  }, []);

  // Auto-scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const filteredSessions = sessions.filter(s =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: 'conversations' as View, label: 'Conversations', icon: MessageSquare },
    { id: 'connectors' as View, label: 'Connectors', icon: Cable },
    { id: 'cron' as View, label: 'Jobs', icon: Clock },
    { id: 'skills' as View, label: 'Skills', icon: Puzzle },
  ];

  const handleSend = async () => {
    if (!inputValue.trim() || streaming) return;
    const text = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Start streaming
    setStreaming(true);
    setStreamingText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: activeSession,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${res.status} ${res.statusText}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Failed to read response stream' }]);
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                fullText += data.text;
                setStreamingText(fullText);
              } else if (data.type === 'done') {
                // Response complete
                setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
                setStreamingText('');
                setStreaming(false);
                if (data.session_id) setActiveSession(data.session_id);
                return;
              } else if (data.type === 'error') {
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.message}` }]);
                setStreamingText('');
                setStreaming(false);
                return;
              }
            } catch { /* skip malformed JSON */ }
          }
        }
      }

      // Fallback: if stream ended without 'done'
      if (fullText) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Connection error: ${err.message}` }]);
      }
    }

    setStreamingText('');
    setStreaming(false);
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
          <button className="chat-new-btn" onClick={() => {
            setActiveSession(null);
            setMessages([{ role: 'assistant', content: 'Hello! I\'m Hermes Claude. How can I help you today?' }]);
          }}>
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
            {/* Streaming indicator */}
            {streaming && streamingText && (
              <div className="chat-message assistant">
                <div className="chat-avatar assistant">✦</div>
                <div className="chat-bubble assistant">
                  {streamingText}
                  <span className="typing-cursor">▊</span>
                </div>
              </div>
            )}
            {streaming && !streamingText && (
              <div className="chat-message assistant">
                <div className="chat-avatar assistant">✦</div>
                <div className="chat-bubble assistant">
                  <span className="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
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
              disabled={streaming}
            />
            <button className="chat-input-send" onClick={handleSend} disabled={streaming || !inputValue.trim()}>
              {streaming ? <Zap size={14} /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
