import { useState, useEffect } from 'react';
import { getConnectors } from '../api/hermes';
import type { ConnectorStatus } from '../types/hermes';
import { Plug, PlugZap, RefreshCw } from 'lucide-react';

interface Props {
  chatMode?: boolean;
  codeMode?: boolean;
}

export default function Connectors({ chatMode, codeMode }: Props) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadConnectors(); }, []);

  async function loadConnectors() {
    try {
      setLoading(true);
      setConnectors(await getConnectors());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isChat = chatMode || (!codeMode && !chatMode);

  const statusBadge = (status: string) => {
    const cls = status === 'connected' ? 'badge-green' : status === 'disconnected' ? 'badge-yellow' : 'badge-red';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  const containerStyle: React.CSSProperties = isChat ? {} : { display: 'flex', flexDirection: 'column', height: '100%' };
  const labelStyle = isChat
    ? { padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--chat-text-muted)' }
    : { padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--code-text-muted)' };

  return (
    <div style={containerStyle}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Platforms</span>
        <button className={isChat ? 'chat-btn-icon' : 'btn-icon'} onClick={loadConnectors}><RefreshCw size={12} /></button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        {loading && <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>Loading...</div>}
        {error && <div style={{ padding: 16, color: 'var(--chat-text-muted)', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        {!loading && !error && connectors.length === 0 && (
          <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>No connectors</div>
        )}
        {connectors.map(conn => (
          <div key={conn.name} style={{ padding: '8px 12px', borderBottom: `1px solid ${isChat ? 'var(--chat-border)' : 'var(--code-border)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              {conn.connected ? <PlugZap size={13} style={{ color: '#22c55e' }} /> : <Plug size={13} style={{ color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)' }} />}
              <span style={{ fontWeight: 500, fontSize: isChat ? 13 : 12 }}>{conn.label}</span>
              <div style={{ marginLeft: 'auto' }}>{statusBadge(conn.status)}</div>
            </div>
            <div style={{ fontSize: 11, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)' }}>
              {conn.platform}{conn.last_active ? ` · ${new Date(conn.last_active).toLocaleDateString()}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
