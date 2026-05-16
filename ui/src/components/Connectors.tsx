import { useState, useEffect } from 'react';
import { getConnectors } from '../api/hermes';
import type { ConnectorStatus } from '../types/hermes';
import { Plug, PlugZap, RefreshCw } from 'lucide-react';

export default function Connectors() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnectors();
  }, []);

  async function loadConnectors() {
    try {
      setLoading(true);
      const data = await getConnectors();
      setConnectors(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <span className="badge badge-green">Connected</span>;
      case 'disconnected': return <span className="badge badge-yellow">Disconnected</span>;
      case 'error': return <span className="badge badge-red">Error</span>;
      default: return <span className="badge badge-blue">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Connected Platforms</span>
        <button className="btn-icon" onClick={loadConnectors} title="Refresh">
          <RefreshCw size={12} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        {loading && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            Loading connectors...
          </div>
        )}

        {error && (
          <div style={{ padding: 16, color: 'var(--red)', textAlign: 'center', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && connectors.length === 0 && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            No connectors configured
          </div>
        )}

        {connectors.map((conn) => (
          <div
            key={conn.name}
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {conn.connected ? <PlugZap size={14} style={{ color: 'var(--green)' }} /> : <Plug size={14} style={{ color: 'var(--text-muted)' }} />}
              <span style={{ fontWeight: 500, fontSize: 12.5 }}>{conn.label || conn.name}</span>
              <div style={{ marginLeft: 'auto' }}>
                {statusBadge(conn.status)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Platform: {conn.platform}
              {conn.last_active && <> · Last active: {new Date(conn.last_active).toLocaleString()}</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
