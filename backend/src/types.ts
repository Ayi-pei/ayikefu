export type Role = 'user' | 'agent';

export interface ChatMessage {
  type: 'chat' | 'notice' | 'welcome' | 'joined' | 'list';
  from?: 'user' | 'agent' | 'system';
  id?: string;
  text?: string;
  ts?: number;
  history?: ChatMessage[];
  list?: Array<{ id: string; hasAgent: boolean }>;
}

// 扩展类型定义
export interface User {
  id: string;
  role: Role;
  connectedAt: number;
  lastActivity?: number;
}

export interface AgentKey {
  keyCode: string;
  agentId: string;
  expiresAt: number;
  isActive: boolean;
  createdAt: number;
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  agentId?: string;
  startTime: number;
  lastActivity: number;
  messageCount: number;
}

export interface WebSocketAuthResult {
  valid: boolean;
  role: Role;
  userId?: string;
  agentId?: string;
  error?: string;
}