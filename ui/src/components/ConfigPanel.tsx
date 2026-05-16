import { useState, useEffect } from 'react';
import { getConfig } from '../api/hermes';
import { RefreshCw } from 'lucide-react';

interface Props {
  codeMode?: boolean;
}

export default function ConfigPanel({ codeMode }: Props) {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isCode = codeMode;

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    try { setLoading(true); setConfig(await getConfig()); setError(null); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  function renderValue(v: unknown): string {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'object') { try { return JSON.stringify(v, null, 2); } catch { return String(v); } }
    return String(v);
  }

  function renderConfig(obj: Record<string, unknown>, depth = 0): React.ReactNode[] {
    const textColor = isCode ? 'var(--code-text)' : 'var(--chat-text)';
    const secColor = isCode ? 'var(--code-text-secondary)' : 'var(--chat-text-secondary)';
    
    const borderColor = isCode ? 'var(--code-border)' : 'var(--chat-border)';
    const bgColor = isCode ? 'var(--code-hover)' : 'var(--chat-hover)';

    return Object.entries(obj).map(([key, value]) => {
      const indent = depth * 12;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return [
          <div key={key} style={{
            padding: `4px 12px 4px ${12 + indent}px`, fontWeight: 600, fontSize: 11,
            color: textColor, borderBottom: `1px solid ${borderColor}`,
            background: depth === 0 ? bgColor : 'transparent',
          }}>{key}</div>,
          ...renderConfig(value as Record<string, unknown>, depth + 1),
        ];
      }
      return (
        <div key={key} style={{
          padding: `2px 12px 2px ${16 + indent}px`, fontSize: 11,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'flex-start',
        }}>
          <span style={{ color: secColor, minWidth: 100, flexShrink: 0 }}>{key}</span>
          <span style={{
            color: Array.isArray(value) ? '#f59e0b' : typeof value === 'boolean' ? '#4a8bff' : textColor,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>{renderValue(value)}</span>
        </div>
      );
    });
  }

  const labelStyle = isCode
    ? { padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--code-text-muted)' }
    : { padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--chat-text-muted)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Configuration</span>
        <button className={isCode ? 'btn-icon' : 'chat-btn-icon'} onClick={loadConfig}><RefreshCw size={12} /></button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && <div style={{ padding: 16, color: 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>Loading...</div>}
        {error && <div style={{ padding: 16, color: 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        {!loading && !error && config && renderConfig(config)}
      </div>
    </div>
  );
}
