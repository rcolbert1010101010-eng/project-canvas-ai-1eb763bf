import { useMemo } from 'react';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];
type TaskStatus = Database['public']['Enums']['task_status'];
type DecisionStatus = Database['public']['Enums']['decision_status'];

// Caps
export const MAX_RECENT_MESSAGES = 10;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Database['public']['Enums']['priority_level'];
  blocked_reason: string | null;
  next_action: string | null;
}

export interface Decision {
  id: string;
  title: string;
  decision: string;
  status: DecisionStatus;
  impact: Database['public']['Enums']['impact_level'];
  rationale: string | null;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  purpose: string | null;
  mode: AIMode;
}

export interface StructuredContext {
  // Core structured memory (always included based on mode)
  pinnedDocuments: Array<{ title: string; content: string }>;
  acceptedDecisions: Array<{ title: string; decision: string; impact: string; rationale?: string }>;
  activeTasks: Array<{ title: string; status: string; priority: string; description?: string; blocked_reason?: string; next_action?: string }>;
  blockedTasks: Array<{ title: string; status: string; priority: string; blocked_reason?: string }>;
  
  // Conversation context
  conversationSummary: string | null;
  conversationPurpose: string | null;
  
  // Recent messages (capped, optional)
  recentMessages: Array<{ role: string; content: string }>;
  includeRecentMessages: boolean;
  
  // Mode for edge function
  mode: AIMode;
}

interface UseAIContextOptions {
  conversation: Conversation | null;
  tasks: Task[];
  decisions: Decision[];
  documents: Document[];
  messages: Message[];
  includeRecentMessages: boolean;
}

/**
 * Mode-specific context rules:
 * - Design: emphasize pinned docs + accepted decisions
 * - Debug: include blocked tasks + last 10 messages
 * - Planning: include in-progress tasks + accepted decisions
 * - Implementation: include pinned docs + in-progress tasks
 * - Review: include decisions + activity summary
 */
export function useAIContext({
  conversation,
  tasks,
  decisions,
  documents,
  messages,
  includeRecentMessages,
}: UseAIContextOptions): StructuredContext {
  return useMemo(() => {
    const mode = conversation?.mode || 'design';
    
    // Filter data based on mode
    const pinnedDocs = documents.filter(d => d.is_pinned);
    const acceptedDecisions = decisions.filter(d => d.status === 'accepted');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    
    // Build context based on mode
    let contextPinnedDocs: typeof pinnedDocs = [];
    let contextDecisions: typeof acceptedDecisions = [];
    let contextActiveTasks: typeof inProgressTasks = [];
    let contextBlockedTasks: typeof blockedTasks = [];
    let shouldIncludeMessages = includeRecentMessages;
    
    switch (mode) {
      case 'design':
        // Emphasize pinned docs + accepted decisions
        contextPinnedDocs = pinnedDocs;
        contextDecisions = acceptedDecisions;
        break;
        
      case 'debug':
        // Include blocked tasks + last 10 messages
        contextBlockedTasks = blockedTasks;
        contextActiveTasks = inProgressTasks; // Include for context
        shouldIncludeMessages = true; // Always include for debug
        break;
        
      case 'planning':
        // Include in-progress tasks + accepted decisions
        contextActiveTasks = inProgressTasks;
        contextDecisions = acceptedDecisions;
        break;
        
      case 'implementation':
        // Include pinned docs + in-progress tasks
        contextPinnedDocs = pinnedDocs;
        contextActiveTasks = inProgressTasks;
        break;
        
      case 'review':
        // Include decisions + activity summary
        contextDecisions = acceptedDecisions;
        contextPinnedDocs = pinnedDocs; // Include docs for review context
        break;
        
      default:
        contextPinnedDocs = pinnedDocs;
        contextDecisions = acceptedDecisions;
        contextActiveTasks = inProgressTasks;
    }
    
    // Cap recent messages to MAX_RECENT_MESSAGES
    const recentMessages = shouldIncludeMessages
      ? messages.slice(-MAX_RECENT_MESSAGES).map(m => ({
          role: m.role,
          content: m.content,
        }))
      : [];
    
    return {
      pinnedDocuments: contextPinnedDocs.map(d => ({
        title: d.title,
        content: d.content,
      })),
      acceptedDecisions: contextDecisions.map(d => ({
        title: d.title,
        decision: d.decision,
        impact: d.impact,
        rationale: d.rationale || undefined,
      })),
      activeTasks: contextActiveTasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        description: t.description || undefined,
        next_action: t.next_action || undefined,
      })),
      blockedTasks: contextBlockedTasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        blocked_reason: t.blocked_reason || undefined,
      })),
      conversationSummary: conversation?.summary || null,
      conversationPurpose: conversation?.purpose || null,
      recentMessages,
      includeRecentMessages: shouldIncludeMessages,
      mode,
    };
  }, [conversation, tasks, decisions, documents, messages, includeRecentMessages]);
}

/**
 * Determine if recent messages should be included by default
 * ON if conversation has no summary yet
 * OFF if summary exists
 */
export function getDefaultIncludeMessages(conversation: Conversation | null): boolean {
  if (!conversation) return true;
  return !conversation.summary;
}
