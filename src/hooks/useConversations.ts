import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];

export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  purpose: string | null;
  summary: string | null;
  is_archived: boolean;
  mode: AIMode;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export function useConversations(projectId: string | null) {
  return useQuery({
    queryKey: ['conversations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*, messages(count)')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((conv: any) => ({
        ...conv,
        message_count: conv.messages?.[0]?.count || 0,
      })) as Conversation[];
    },
    enabled: !!projectId,
  });
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Conversation | null;
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      project_id, 
      title, 
      purpose, 
      mode = 'design' 
    }: { 
      project_id: string; 
      title: string; 
      purpose?: string; 
      mode?: AIMode;
    }) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ project_id, title, purpose, mode })
        .select()
        .single();
      
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', data.project_id] });
      toast({ title: 'Conversation started' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      title, 
      purpose, 
      summary, 
      is_archived, 
      mode 
    }: { 
      id: string; 
      title?: string; 
      purpose?: string; 
      summary?: string; 
      is_archived?: boolean; 
      mode?: AIMode;
    }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ title, purpose, summary, is_archived, mode })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      summary, 
      purpose 
    }: { 
      id: string; 
      summary: string; 
      purpose?: string;
    }) => {
      const updateData: { is_archived: boolean; summary: string; purpose?: string } = {
        is_archived: true,
        summary,
      };
      
      if (purpose) {
        updateData.purpose = purpose;
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({ title: 'Conversation archived', description: 'Summary saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUnarchiveConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ is_archived: false })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['conversation', data.id] });
      toast({ title: 'Conversation unarchived' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
