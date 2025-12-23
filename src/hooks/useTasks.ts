import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type Priority = Database['public']['Enums']['priority_level'];

export interface Task {
  id: string;
  project_id: string;
  conversation_id: string | null;
  title: string;
  description: string | null;
  next_action: string | null;
  status: TaskStatus;
  blocked_reason: string | null;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export function useTasks(projectId: string | null) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      project_id,
      conversation_id,
      title,
      description,
      next_action,
      priority = 'medium',
    }: { 
      project_id: string;
      conversation_id?: string;
      title: string;
      description?: string;
      next_action?: string;
      priority?: Priority;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ project_id, conversation_id, title, description, next_action, priority })
        .select()
        .single();
      
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      toast({ title: 'Task created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      title,
      description,
      next_action,
      status,
      blocked_reason,
      priority,
    }: { 
      id: string;
      title?: string;
      description?: string;
      next_action?: string;
      status?: TaskStatus;
      blocked_reason?: string;
      priority?: Priority;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ title, description, next_action, status, blocked_reason, priority })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({ title: 'Task deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
