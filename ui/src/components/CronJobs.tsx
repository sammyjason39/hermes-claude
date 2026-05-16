import { useState, useEffect } from 'react';
import { getCronJobs, pauseCronJob, resumeCronJob, triggerCronJob, deleteCronJob } from '../api/hermes';
import type { CronJob } from '../types/hermes';
import { Clock, Play, Pause, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  chatMode?: boolean;
  codeMode?: boolean;
}

export default function CronJobs({ chatMode, codeMode }: Props) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isChat = chatMode || (!codeMode && !chatMode);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    try { setLoading(true); setJobs(await getCronJobs()); setError(null); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  const jobActions = (job: CronJob) => (
    <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
      {job.state === 'enabled'
        ? <button className={isChat ? 'chat-btn-icon' : 'btn-icon'} onClick={() => pauseCronJob(job.id).then(loadJobs)}><Pause size={10} /></button>
        : <button className={isChat ? 'chat-btn-icon' : 'btn-icon'} onClick={() => resumeCronJob(job.id).then(loadJobs)}><Play size={10} /></button>}
      <button className={isChat ? 'chat-btn-icon' : 'btn-icon'} onClick={() => triggerCronJob(job.id)}><RefreshCw size={10} /></button>
      <button className={isChat ? 'chat-btn-icon' : 'btn-icon'} onClick={() => deleteCronJob(job.id).then(loadJobs)}><Trash2 size={10} /></button>
    </div>
  );

  const labelStyle = isChat
    ? { padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--chat-text-muted)' }
    : { padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--code-text-muted)' };

  const stateBadge = (state: string) => {
    const c = state === 'enabled' ? 'badge-green' : state === 'paused' ? 'badge-yellow' : 'badge-red';
    return <span className={`badge ${c}`}>{state}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Tasks ({jobs.length})</span>
        <button className={isChat ? 'chat-btn-icon' : 'btn-icon'} onClick={loadJobs}><RefreshCw size={12} /></button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>Loading...</div>}
        {error && <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>{error}</div>}
        {!loading && !error && jobs.length === 0 && <div style={{ padding: 16, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)', textAlign: 'center', fontSize: 12 }}>No scheduled tasks</div>}
        {jobs.map(job => (
          <div key={job.id} style={{ padding: '8px 12px', borderBottom: `1px solid ${isChat ? 'var(--chat-border)' : 'var(--code-border)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Clock size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
              <span style={{ fontWeight: 500, fontSize: isChat ? 13 : 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.name || job.prompt?.slice(0, 30) + '...' || 'Job'}
              </span>
              {stateBadge(job.state)}
            </div>
            <div style={{ fontSize: 11, color: isChat ? 'var(--chat-text-muted)' : 'var(--code-text-muted)' }}>
              <code style={{ color: isChat ? 'var(--claude-accent)' : 'var(--claude-code-accent)' }}>{job.schedule}</code>
              {job.delivery && ` · ${job.delivery}`}
            </div>
            {jobActions(job)}
          </div>
        ))}
      </div>
    </div>
  );
}
