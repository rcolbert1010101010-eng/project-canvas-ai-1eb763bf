import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];

export const MESSAGE_PAGE_SIZE = 20;

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface MessagePage {
  messages: Message[];
  oldestCursor: string | null;
  hasMore: boolean;
}

/**
 * Fetch paginated messages for a conversation.
 * Uses cursor-based pagination with created_at.
 * Returns messages in chronological order.
 */
export function usePaginatedMessages(conversationId: string | null, enabled: boolean = true) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId, 'paginated'],
    queryFn: async ({ pageParam }): Promise<MessagePage> => {
      if (!conversationId) {
        return { messages: [], oldestCursor: null, hasMore: false };
      }

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      // If we have a cursor, fetch messages older than it
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;

      if (error) throw error;

      const messages = (data as Message[]).reverse(); // Reverse to chronological order
      const oldestCursor = data.length > 0 ? data[data.length - 1].created_at : null;
      const hasMore = data.length === MESSAGE_PAGE_SIZE;

      return { messages, oldestCursor, hasMore };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.oldestCursor : undefined;
    },
    initialPageParam: null as string | null,
    enabled: !!conversationId && enabled,
    staleTime: 0, // Always refetch to get latest messages
  });
}

/**
 * Helper hook to flatten paginated messages into a single array
 * in chronological order (oldest first)
 */
export function useFlattenedMessages(conversationId: string | null, enabled: boolean = true) {
  const query = usePaginatedMessages(conversationId, enabled);
  
  // Flatten pages: older pages come first, then newer pages
  // Each page's messages are already in chronological order
  const messages = query.data?.pages
    .slice()
    .reverse() // Reverse pages so oldest page comes first
    .flatMap(page => page.messages) ?? [];

  const hasOlderMessages = query.data?.pages[query.data.pages.length - 1]?.hasMore ?? false;

  return {
    messages,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasOlderMessages,
    fetchOlderMessages: query.fetchNextPage,
    refetch: query.refetch,
  };
}

/**
 * Legacy hook for backwards compatibility - now uses pagination
 */
export function useMessages(conversationId: string | null, enabled: boolean = true) {
  const { messages, isLoading } = useFlattenedMessages(conversationId, enabled);
  
  return {
    data: messages,
    isLoading,
  };
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      conversation_id,
      role,
      content,
    }: { 
      conversation_id: string;
      role: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id, role, content })
        .select()
        .single();
      
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (data) => {
      // Invalidate paginated queries
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversationMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      mode,
    }: { 
      id: string;
      mode: AIMode;
    }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ mode })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
    },
  });
}
