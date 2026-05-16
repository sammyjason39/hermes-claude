import type {
  SessionSummary,
  SessionMessage,
  CronJob,
  ConnectorStatus,
  SkillInfo,
} from '../types/hermes';

const API_BASE = '/api/hermes';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Status ---
export async function getStatus() {
  return fetchJSON<Record<string, unknown>>(`${API_BASE}/status`);
}

// --- Sessions ---
// Map Hermes Dashboard API fields → our frontend types
function mapSession(raw: any): SessionSummary {
  return {
    session_id: raw.id || raw.session_id || '',
    title: raw.title && raw.title !== 'None' ? raw.title : (raw.preview?.substring(0, 60) || 'New conversation'),
    platform: raw.source || raw.platform || 'cli',
    model: raw.model || '',
    message_count: raw.message_count || 0,
    tool_call_count: raw.tool_call_count || 0,
    token_count: raw.input_tokens || raw.token_count || 0,
    created_at: raw.created_at || raw.started_at || '',
    last_activity: raw.last_active || raw.updated_at || raw.last_activity || raw.created_at || raw.started_at || '',
    is_active: raw.is_active ?? false,
  };
}

export async function getSessions(offset = 0, limit = 50): Promise<SessionSummary[]> {
  const data = await fetchJSON<{ sessions: any[] }>(
    `${API_BASE}/sessions?offset=${offset}&limit=${limit}`
  );
  return (data.sessions || []).map(mapSession);
}

export async function searchSessions(query: string): Promise<SessionSummary[]> {
  const data = await fetchJSON<{ sessions: any[] }>(
    `${API_BASE}/sessions/search?q=${encodeURIComponent(query)}`
  );
  return (data.sessions || []).map(mapSession);
}

export async function getSessionMessages(id: string): Promise<SessionMessage[]> {
  return fetchJSON<SessionMessage[]>(`${API_BASE}/sessions/${id}/messages`);
}

export async function deleteSession(id: string): Promise<void> {
  await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
}

// --- Cron ---
export async function getCronJobs(): Promise<CronJob[]> {
  return fetchJSON<CronJob[]>(`${API_BASE}/cron/jobs`);
}

export async function pauseCronJob(id: string): Promise<void> {
  await fetchJSON(`${API_BASE}/cron/${id}/pause`, { method: 'POST' });
}

export async function resumeCronJob(id: string): Promise<void> {
  await fetchJSON(`${API_BASE}/cron/${id}/resume`, { method: 'POST' });
}

export async function triggerCronJob(id: string): Promise<void> {
  await fetchJSON(`${API_BASE}/cron/${id}/trigger`, { method: 'POST' });
}

export async function deleteCronJob(id: string): Promise<void> {
  await fetch(`${API_BASE}/cron/${id}`, { method: 'DELETE' });
}

// --- Connectors (extracted from /status) ---
export async function getConnectors(): Promise<ConnectorStatus[]> {
  const status = await fetchJSON<{
    gateway_platforms?: Record<string, { state: string; updated_at?: string; error_message?: string }>;
  }>(`${API_BASE}/status`);
  const platforms = status.gateway_platforms || {};
  return Object.entries(platforms).map(([name, info]) => ({
    name,
    platform: name,
    connected: info.state === 'connected',
    status: info.state as 'connected' | 'disconnected' | 'error',
    last_active: info.updated_at || null,
    label: name.charAt(0).toUpperCase() + name.slice(1),
  }));
}

// --- Skills ---
export async function getSkills(): Promise<SkillInfo[]> {
  const data = await fetchJSON<{ skills?: SkillInfo[] } | SkillInfo[]>(`${API_BASE}/skills`);
  if (Array.isArray(data)) return data;
  return data.skills || [];
}

// --- Config ---
export async function getConfig(): Promise<Record<string, unknown>> {
  return fetchJSON<Record<string, unknown>>(`${API_BASE}/config`);
}

export async function saveConfig(config: Record<string, unknown>): Promise<void> {
  await fetchJSON(`${API_BASE}/config`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

// --- WebSocket PTY ---
export function connectPtyWebSocket(): WebSocket {
  return new WebSocket(`ws://localhost:3001/api/pty`);
}

// Helper: format relative time
export function timeAgo(dateStr: string): string {
  if (!dateStr) return 'recently';
  let date: number;
  // Handle Unix timestamp (seconds since epoch)
  if (/^\d+(\.\d+)?$/.test(dateStr)) {
    date = parseFloat(dateStr) * 1000;
  } else {
    date = new Date(dateStr).getTime();
  }
  if (isNaN(date)) return 'recently';
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
