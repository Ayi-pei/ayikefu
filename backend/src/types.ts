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
