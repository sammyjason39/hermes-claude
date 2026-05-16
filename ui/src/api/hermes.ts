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
export async function getSessions(offset = 0, limit = 50): Promise<SessionSummary[]> {
  const data = await fetchJSON<{ sessions: SessionSummary[] }>(
    `${API_BASE}/sessions?offset=${offset}&limit=${limit}`
  );
  return data.sessions || [];
}

export async function searchSessions(query: string): Promise<SessionSummary[]> {
  const data = await fetchJSON<{ sessions: SessionSummary[] }>(
    `${API_BASE}/sessions/search?q=${encodeURIComponent(query)}`
  );
  return data.sessions || [];
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

// --- Token ---
export async function getHermesToken(): Promise<string | null> {
  try {
    const data = await fetchJSON<{ token: string }>(`${API_BASE}/token`);
    return data.token;
  } catch {
    return null;
  }
}

// --- WebSocket PTY ---
export function connectPtyWebSocket(): WebSocket {
  return new WebSocket(`ws://localhost:3001/api/pty`);
}

// Helper: format relative time
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
