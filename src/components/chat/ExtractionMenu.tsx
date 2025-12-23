import { useState } from 'react';
import { Wand2, CheckSquare, Lightbulb, FileText, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCreateTask } from '@/hooks/useTasks';
import { useCreateDecision } from '@/hooks/useDecisions';
import { useCreateDocument } from '@/hooks/useDocuments';
import { cn } from '@/lib/utils';

interface ExtractionMenuProps {
  content: string;
  projectId: string;
  conversationId: string;
  className?: string;
}

type ExtractionType = 'task' | 'decision' | 'document' | 'auto';

const EXTRACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract`;

export function ExtractionMenu({ content, projectId, conversationId, className }: ExtractionMenuProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractingType, setExtractingType] = useState<ExtractionType | null>(null);
  const { toast } = useToast();
  
  const createTask = useCreateTask();
  const createDecision = useCreateDecision();
  const createDocument = useCreateDocument();

  const handleExtract = async (type: ExtractionType) => {
    setIsExtracting(true);
    setExtractingType(type);

    try {
      const response = await fetch(EXTRACT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ content, extractionType: type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      const result = await response.json();
      
      if (type === 'auto') {
        // Handle auto extraction (multiple items)
        const { tasks = [], decisions = [], documents = [] } = result.data;
        
        let created = { tasks: 0, decisions: 0, documents: 0 };
        
        for (const task of tasks) {
          await createTask.mutateAsync({
            project_id: projectId,
            conversation_id: conversationId,
            title: task.title,
            description: task.description,
            next_action: task.next_action,
            priority: task.priority,
          });
          created.tasks++;
        }
        
        for (const decision of decisions) {
          await createDecision.mutateAsync({
            project_id: projectId,
            conversation_id: conversationId,
            title: decision.title,
            decision: decision.decision,
            rationale: decision.rationale,
            impact: decision.impact,
          });
          created.decisions++;
        }
        
        for (const doc of documents) {
          await createDocument.mutateAsync({
            project_id: projectId,
            title: doc.title,
            content: doc.content,
            is_pinned: doc.is_pinned || false,
          });
          created.documents++;
        }
        
        const parts = [];
        if (created.tasks > 0) parts.push(`${created.tasks} task${created.tasks > 1 ? 's' : ''}`);
        if (created.decisions > 0) parts.push(`${created.decisions} decision${created.decisions > 1 ? 's' : ''}`);
        if (created.documents > 0) parts.push(`${created.documents} document${created.documents > 1 ? 's' : ''}`);
        
        if (parts.length > 0) {
          toast({ title: 'Extracted', description: `Created ${parts.join(', ')}` });
        } else {
          toast({ title: 'No items found', description: 'No actionable items were found in this message.' });
        }
      } else {
        // Handle single extraction
        const data = result.data;
        
        if (type === 'task') {
          await createTask.mutateAsync({
            project_id: projectId,
            conversation_id: conversationId,
            title: data.title,
            description: data.description,
            next_action: data.next_action,
            priority: data.priority,
          });
          toast({ title: 'Task created', description: data.title });
        } else if (type === 'decision') {
          await createDecision.mutateAsync({
            project_id: projectId,
            conversation_id: conversationId,
            title: data.title,
            decision: data.decision,
            rationale: data.rationale,
            impact: data.impact,
          });
          toast({ title: 'Decision created', description: data.title });
        } else if (type === 'document') {
          await createDocument.mutateAsync({
            project_id: projectId,
            title: data.title,
            content: data.content,
            is_pinned: data.is_pinned || false,
          });
          toast({ title: 'Document created', description: data.title });
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
      setExtractingType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-7 w-7", className)}
          disabled={isExtracting}
        >
          {isExtracting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExtract('auto')} disabled={isExtracting}>
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          <span>Auto Extract All</span>
          {extractingType === 'auto' && <Loader2 className="w-3 h-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExtract('task')} disabled={isExtracting}>
          <CheckSquare className="w-4 h-4 mr-2 text-info" />
          <span>Extract Task</span>
          {extractingType === 'task' && <Loader2 className="w-3 h-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExtract('decision')} disabled={isExtracting}>
          <Lightbulb className="w-4 h-4 mr-2 text-warning" />
          <span>Extract Decision</span>
          {extractingType === 'decision' && <Loader2 className="w-3 h-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExtract('document')} disabled={isExtracting}>
          <FileText className="w-4 h-4 mr-2 text-primary" />
          <span>Extract Document</span>
          {extractingType === 'document' && <Loader2 className="w-3 h-3 ml-auto animate-spin" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
