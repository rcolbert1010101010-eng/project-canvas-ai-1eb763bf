import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export function useDocuments(projectId: string | null) {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!projectId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      project_id,
      title,
      content = '',
      is_pinned = false,
    }: { 
      project_id: string;
      title: string;
      content?: string;
      is_pinned?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({ project_id, title, content, is_pinned })
        .select()
        .single();
      
      if (error) throw error;
      return data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', data.project_id] });
      toast({ title: 'Document created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      title,
      content,
      is_pinned,
    }: { 
      id: string;
      title?: string;
      content?: string;
      is_pinned?: boolean;
    }) => {
      // Get current version to increment
      const { data: current } = await supabase
        .from('documents')
        .select('version')
        .eq('id', id)
        .single();
      
      const newVersion = (current?.version || 0) + 1;
      
      const { data, error } = await supabase
        .from('documents')
        .update({ title, content, is_pinned, version: newVersion })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', data.project_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast({ title: 'Document deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
