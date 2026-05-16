import { useState, useEffect } from 'react';
import { getConfig } from '../api/hermes';
import { RefreshCw } from 'lucide-react';

export default function ConfigPanel() {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = await getConfig();
      setConfig(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function renderValue(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  function renderConfig(obj: Record<string, unknown>, depth = 0): React.ReactElement[] {
    return Object.entries(obj).map(([key, value]) => {
      const indent = depth * 12;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={key}>
            <div
              style={{
                padding: `4px 12px 4px ${12 + indent}px`,
                fontWeight: 600,
                fontSize: 11.5,
                color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border-color)',
                background: depth === 0 ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              {key}
            </div>
            {renderConfig(value as Record<string, unknown>, depth + 1)}
          </div>
        );
      }
      return (
        <div
          key={key}
          style={{
            padding: `3px 12px 3px ${16 + indent}px`,
            fontSize: 11.5,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <span
            style={{
              color: 'var(--text-secondary)',
              minWidth: 120,
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >
            {key}
          </span>
          <span
            style={{
              color: Array.isArray(value) ? 'var(--yellow)' : typeof value === 'boolean' ? 'var(--blue)' : 'var(--text-primary)',
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {renderValue(value)}
          </span>
        </div>
      );
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Configuration</span>
        <button className="btn-icon" onClick={loadConfig} title="Refresh">
          <RefreshCw size={12} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            Loading config...
          </div>
        )}
        {error && (
          <div style={{ padding: 16, color: 'var(--red)', textAlign: 'center', fontSize: 12 }}>
            {error}
          </div>
        )}
        {!loading && !error && config && renderConfig(config)}
      </div>
    </div>
  );
}
