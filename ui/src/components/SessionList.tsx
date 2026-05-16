import { useState, useEffect } from 'react';
import { getSessions, searchSessions, timeAgo } from '../api/hermes';
import type { SessionSummary } from '../types/hermes';
import { Search, MessageSquare, Trash2 } from 'lucide-react';

interface Props {
  onSelectSession: (id: string) => void;
}

export default function SessionList({ onSelectSession }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const data = await getSessions(0, 100);
      setSessions(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      loadSessions();
      return;
    }
    try {
      const data = await searchSessions(q);
      setSessions(data);
    } catch {
      // fallback
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/hermes/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.session_id !== id));
      }
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '8px 12px', position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 20, top: 14, color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px 6px 28px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div className="sidebar-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Sessions ({sessions.length})</span>
        <button className="btn-icon" onClick={loadSessions} title="Refresh" style={{ fontSize: 11 }}>
          ↻
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            Loading sessions...
          </div>
        )}

        {error && (
          <div style={{ padding: 16, color: 'var(--red)', textAlign: 'center', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            No sessions yet
          </div>
        )}

        {!loading &&
          sessions.map((session) => (
            <div
              key={session.session_id}
              className="sidebar-item"
              onClick={() => onSelectSession(session.session_id)}
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 2,
                padding: '8px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                <MessageSquare size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {session.title || 'Untitled'}
                </span>
                {session.is_active && (
                  <span className="badge badge-green" style={{ fontSize: 9 }}>LIVE</span>
                )}
                <button
                  className="btn-icon"
                  onClick={(e) => handleDelete(session.session_id, e)}
                  title="Delete session"
                  style={{ opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                <span>{timeAgo(session.last_activity)}</span>
                <span>·</span>
                <span>{session.model?.split('/').pop()}</span>
                <span>·</span>
                <span>{session.message_count} msgs</span>
                {session.tool_call_count > 0 && (
                  <>
                    <span>·</span>
                    <span>{session.tool_call_count} tools</span>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
