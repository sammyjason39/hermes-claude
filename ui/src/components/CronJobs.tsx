import { useState, useEffect } from 'react';
import { getCronJobs, pauseCronJob, resumeCronJob, triggerCronJob, deleteCronJob } from '../api/hermes';
import type { CronJob } from '../types/hermes';
import { Clock, Play, Pause, Trash2, RefreshCw } from 'lucide-react';

export default function CronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const data = await getCronJobs();
      setJobs(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePause(id: string) {
    try {
      await pauseCronJob(id);
      loadJobs();
    } catch (e) {
      console.error('Failed to pause:', e);
    }
  }

  async function handleResume(id: string) {
    try {
      await resumeCronJob(id);
      loadJobs();
    } catch (e) {
      console.error('Failed to resume:', e);
    }
  }

  async function handleTrigger(id: string) {
    try {
      await triggerCronJob(id);
    } catch (e) {
      console.error('Failed to trigger:', e);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCronJob(id);
      loadJobs();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  }

  const stateBadge = (state: string) => {
    switch (state) {
      case 'enabled': return <span className="badge badge-green">Active</span>;
      case 'paused': return <span className="badge badge-yellow">Paused</span>;
      case 'error': return <span className="badge badge-red">Error</span>;
      default: return <span className="badge badge-blue">{state}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Scheduled Tasks ({jobs.length})</span>
        <button className="btn-icon" onClick={loadJobs} title="Refresh">
          <RefreshCw size={12} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            Loading cron jobs...
          </div>
        )}

        {error && (
          <div style={{ padding: 16, color: 'var(--red)', textAlign: 'center', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            No cron jobs scheduled
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-color)',
              cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Clock size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
              <span style={{ fontWeight: 500, fontSize: 12.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.name || job.prompt?.slice(0, 40) + '...' || 'Untitled Job'}
              </span>
              {stateBadge(job.state)}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              <div>Schedule: <code style={{ color: 'var(--accent)' }}>{job.schedule}</code></div>
              {job.prompt && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Prompt: {job.prompt.slice(0, 60)}...</div>}
              <div>Delivery: {job.delivery}</div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {job.state === 'enabled' ? (
                <button className="btn-icon" onClick={() => handlePause(job.id)} title="Pause" style={{ fontSize: 11 }}>
                  <Pause size={11} />
                </button>
              ) : (
                <button className="btn-icon" onClick={() => handleResume(job.id)} title="Resume" style={{ fontSize: 11 }}>
                  <Play size={11} />
                </button>
              )}
              <button className="btn-icon" onClick={() => handleTrigger(job.id)} title="Run now" style={{ fontSize: 11 }}>
                <RefreshCw size={11} />
              </button>
              <button className="btn-icon" onClick={() => handleDelete(job.id)} title="Delete" style={{ fontSize: 11 }}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
