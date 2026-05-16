import { useState, useEffect } from 'react';
import { getSkills } from '../api/hermes';
import type { SkillInfo } from '../types/hermes';
import { Puzzle, Search } from 'lucide-react';

export default function SkillsPanel() {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      setLoading(true);
      const data = await getSkills();
      setSkills(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce(
    (acc, s) => {
      const cat = s.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, SkillInfo[]>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="sidebar-section" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Skills & Commands</span>
      </div>

      {/* Search */}
      <div style={{ padding: '4px 12px 8px', position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 20, top: 11, color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px 5px 26px',
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

      {/* Info bar */}
      <div style={{ padding: '0 12px 8px', fontSize: 11, color: 'var(--text-muted)' }}>
        Type <code style={{ color: 'var(--accent)', background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>/skill name</code> in chat to load
      </div>

      {/* Skills list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            Loading skills...
          </div>
        )}

        {error && (
          <div style={{ padding: 16, color: 'var(--red)', textAlign: 'center', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && Object.keys(grouped).length === 0 && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            {searchQuery ? 'No matching skills' : 'No skills available'}
          </div>
        )}

        {Object.entries(grouped).map(([category, catskills]) => (
          <div key={category}>
            <div className="sidebar-section" style={{ padding: '8px 12px 4px' }}>
              {category}
            </div>
            {catskills.map((skill) => (
              <div
                key={skill.name}
                className="sidebar-item"
                style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 2,
                  padding: '6px 16px',
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Puzzle size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                  <code style={{ fontSize: 12, color: 'var(--accent)' }}>/{skill.name}</code>
                  {skill.enabled ? (
                    <span className="badge badge-green" style={{ fontSize: 9 }}>ON</span>
                  ) : (
                    <span className="badge badge-yellow" style={{ fontSize: 9 }}>OFF</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 17 }}>
                  {skill.description}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
