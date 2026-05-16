export interface HermesStatus {
  version: string;
  release_date: string;
  gateway: {
    pid: number | null;
    state: 'running' | 'stopped';
    platforms: string[];
  };
  active_sessions: number;
  recent_sessions: SessionSummary[];
}

export interface SessionSummary {
  session_id: string;
  title: string;
  platform: string;
  model: string;
  message_count: number;
  tool_call_count: number;
  token_count: number;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  created_at: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
}

export interface CronJob {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  state: 'enabled' | 'paused' | 'error';
  last_run: string | null;
  next_run: string | null;
  delivery: string;
  skills: string[];
}

export interface ConnectorStatus {
  name: string;
  platform: string;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  last_active: string | null;
  label: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface ConfigEntry {
  key: string;
  value: unknown;
  description: string;
  category: string;
}

export interface EnvVar {
  key: string;
  set: boolean;
  preview: string | null;
  description: string;
  category: string;
}

export interface ProfileInfo {
  name: string;
  is_active: boolean;
  model: string;
  platforms: string[];
}
