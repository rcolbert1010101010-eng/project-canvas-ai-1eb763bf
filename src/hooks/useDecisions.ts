import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DecisionStatus = Database['public']['Enums']['decision_status'];
type Impact = Database['public']['Enums']['impact_level'];

export interface Decision {
  id: string;
  project_id: string;
  conversation_id: string | null;
  title: string;
  decision: string;
  rationale: string | null;
  status: DecisionStatus;
  impact: Impact;
  supersedes_decision_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useDecisions(projectId: string | null) {
  return useQuery({
    queryKey: ['decisions', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Decision[];
    },
    enabled: !!projectId,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      project_id,
      conversation_id,
      title,
      decision,
      rationale,
      impact = 'medium',
    }: { 
      project_id: string;
      conversation_id?: string;
      title: string;
      decision: string;
      rationale?: string;
      impact?: Impact;
    }) => {
      const { data, error } = await supabase
        .from('decisions')
        .insert({ project_id, conversation_id, title, decision, rationale, impact })
        .select()
        .single();
      
      if (error) throw error;
      return data as Decision;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['decisions', data.project_id] });
      toast({ title: 'Decision recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      title,
      decision,
      rationale,
      status,
      impact,
      supersedes_decision_id,
    }: { 
      id: string;
      title?: string;
      decision?: string;
      rationale?: string;
      status?: DecisionStatus;
      impact?: Impact;
      supersedes_decision_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('decisions')
        .update({ title, decision, rationale, status, impact, supersedes_decision_id })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Decision;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['decisions', data.project_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
