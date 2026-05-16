import { useState, useEffect } from 'react';
import { getSessions, searchSessions, timeAgo } from '../api/hermes';
import type { SessionSummary } from '../types/hermes';
import { Search, MessageSquare, Trash2 } from 'lucide-react';

interface Props {
  onSelectSession: (id: string) => void;
  codeMode?: boolean;
}

export default function SessionList({ onSelectSession, codeMode }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isCode = codeMode;

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    try { setLoading(true); setSessions(await getSessions(0, 100)); setError(null); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { loadSessions(); return; }
    try { setSessions(await searchSessions(q)); } catch {}
  }

  const inputBg = isCode ? 'var(--code-input-bg)' : 'var(--chat-bg)';
  const borderColor = isCode ? 'var(--code-border)' : 'var(--chat-border)';
  const textColor = isCode ? 'var(--code-text)' : 'var(--chat-text)';
  const mutedColor = isCode ? 'var(--code-text-muted)' : 'var(--chat-text-muted)';
  const hoverBg = isCode ? 'var(--code-hover)' : 'var(--chat-hover)';
  const activeBg = isCode ? 'var(--code-active)' : 'var(--chat-hover)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: isCode ? '8px 12px' : '8px 16px', position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: isCode ? 20 : 24, top: 14, color: mutedColor }} />
        <input
          type="text" placeholder="Search sessions..."
          value={searchQuery} onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%', padding: '5px 8px 5px 26px',
            background: inputBg, border: `1px solid ${borderColor}`,
            borderRadius: 6, color: textColor, fontSize: 12, outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && <div style={{ padding: 16, color: mutedColor, textAlign: 'center', fontSize: 12 }}>Loading sessions...</div>}
        {error && <div style={{ padding: 16, color: mutedColor, textAlign: 'center', fontSize: 12 }}>{error}</div>}
        {!loading && !error && sessions.length === 0 && (
          <div style={{ padding: 16, color: mutedColor, textAlign: 'center', fontSize: 12 }}>No sessions yet</div>
        )}
        {sessions.map(s => (
          <div
            key={s.session_id}
            onClick={() => onSelectSession(s.session_id)}
            style={{
              padding: isCode ? '8px 12px' : '8px 16px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 2,
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (e.currentTarget.style.background !== activeBg) e.currentTarget.style.background = hoverBg; }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
              <MessageSquare size={12} style={{ flexShrink: 0, opacity: 0.4 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, fontSize: isCode ? 13 : 13, color: textColor }}>
                {s.title || 'Untitled'}
              </span>
              {s.is_active && <span className="badge badge-green" style={{ fontSize: 8 }}>LIVE</span>}
              <button className={isCode ? 'btn-icon' : 'chat-btn-icon'} onClick={e => { e.stopPropagation(); fetch(`/api/hermes/sessions/${s.session_id}`, {method:'DELETE'}).then(() => loadSessions()); }} style={{ opacity: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                <Trash2 size={10} />
              </button>
            </div>
            <div style={{ fontSize: 10, color: mutedColor, display: 'flex', gap: 6 }}>
              <span>{timeAgo(s.last_activity)}</span>
              <span>·</span>
              <span>{s.model?.split('/').pop()}</span>
              <span>·</span>
              <span>{s.message_count} msgs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
