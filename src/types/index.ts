export type AIMode = 'design' | 'debug' | 'planning' | 'implementation' | 'review';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type DecisionStatus = 'proposed' | 'accepted' | 'deprecated';
export type Impact = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  purpose: string;
  summary: string | null;
  is_archived: boolean;
  mode: AIMode;
  created_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  conversation_id: string | null;
  title: string;
  description: string;
  next_action: string | null;
  status: TaskStatus;
  blocked_reason: string | null;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  project_id: string;
  conversation_id: string | null;
  title: string;
  decision: string;
  rationale: string;
  status: DecisionStatus;
  impact: Impact;
  supersedes_decision_id: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  type: 'decision_created' | 'task_status_changed' | 'document_edited' | 'conversation_archived';
  entity_id: string;
  entity_type: 'decision' | 'task' | 'document' | 'conversation';
  description: string;
  created_at: string;
}
