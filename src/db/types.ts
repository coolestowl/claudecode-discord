export type SessionStatus = "online" | "offline" | "waiting" | "idle";

export type AuthMode = "subscription" | "api_key";

export interface Project {
  channel_id: string;
  project_path: string;
  guild_id: string;
  auto_approve: number; // 0 or 1
  auth_mode: AuthMode;
  model: string | null;
  workspace_name: string | null; // Coder workspace name; null = local
  created_at: string;
}

export interface Session {
  id: string;
  channel_id: string;
  session_id: string | null; // Claude Agent SDK session ID
  status: SessionStatus;
  last_activity: string | null;
  created_at: string;
}
