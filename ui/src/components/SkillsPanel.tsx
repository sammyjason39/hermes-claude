import { useState, useEffect } from 'react';
import { getSkills } from '../api/hermes';
import type { SkillInfo } from '../types/hermes';
import { Puzzle, Search } from 'lucide-react';

interface Props {
  chatMode?: boolean;
  codeMode?: boolean;
}

export default function SkillsPanel({ chatMode, codeMode }: Props) {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isChat = chatMode || (!codeMode && !chatMode);

  useEffect(() => { getSkills().then(setSkills).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, SkillInfo[]>);

  const labelStyle = isChat
    ? { padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--chat-text-muted)' }
    : { padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--code-text-muted)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={labelStyle}>Skills ({skills.length})</div>
      <div style={{ padding: '4px 12px 8px', position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 20, top: 11, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)' }} />
        <input
          type="text" placeholder="Search..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '5px 8px 5px 26px',
            background: isChat ? 'var(--chat-bg)' : 'var(--code-input-bg)',
            border: `1px solid ${isChat ? 'var(--chat-border)' : 'var(--code-border)'}`,
            borderRadius: 6, color: isChat ? 'var(--chat-text)' : 'var(--code-text)',
            fontSize: 12, outline: 'none', fontFamily: 'var(--font-sans)',
          }}
        />
      </div>
      {isChat && (
        <div style={{ padding: '0 16px 8px', fontSize: 11, color: 'var(--chat-text-muted)' }}>
          Type <code style={{ color: 'var(--claude-accent)', background: 'var(--chat-code-bg)', padding: '1px 4px', borderRadius: 3 }}>/skill name</code> in chat
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>Loading...</div>}
        {error && <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        {Object.entries(grouped).map(([cat, catSkills]) => (
          <div key={cat}>
            <div style={labelStyle}>{cat}</div>
            {catSkills.map(s => (
              <div key={s.name} style={{
                padding: isChat ? '6px 16px' : '5px 12px', cursor: 'default',
                display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Puzzle size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
                  <code style={{ fontSize: isChat ? 12 : 11, color: isChat ? 'var(--claude-accent)' : 'var(--claude-code-accent)' }}>/{s.name}</code>
                  <span className={`badge ${s.enabled ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 8 }}>{s.enabled ? 'ON' : 'OFF'}</span>
                </div>
                <div style={{ fontSize: 11, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', paddingLeft: 16 }}>{s.description}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
