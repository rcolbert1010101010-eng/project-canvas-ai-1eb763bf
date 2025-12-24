import { X, CheckSquare, Lightbulb, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task } from '@/hooks/useTasks';
import type { Decision } from '@/hooks/useDecisions';
import type { Document } from '@/hooks/useDocuments';

interface ContextPanelProps {
  tasks: Task[];
  decisions: Decision[];
  documents: Document[];
  selectedContext: {
    tasks: string[];
    decisions: string[];
    documents: string[];
  };
  onContextChange: (context: { tasks: string[]; decisions: string[]; documents: string[] }) => void;
  onClose: () => void;
}

export function ContextPanel({
  tasks,
  decisions,
  documents,
  selectedContext,
  onContextChange,
  onClose,
}: ContextPanelProps) {
  const toggleTask = (id: string) => {
    const newTasks = selectedContext.tasks.includes(id)
      ? selectedContext.tasks.filter(t => t !== id)
      : [...selectedContext.tasks, id];
    onContextChange({ ...selectedContext, tasks: newTasks });
  };

  const toggleDecision = (id: string) => {
    const newDecisions = selectedContext.decisions.includes(id)
      ? selectedContext.decisions.filter(d => d !== id)
      : [...selectedContext.decisions, id];
    onContextChange({ ...selectedContext, decisions: newDecisions });
  };

  const toggleDocument = (id: string) => {
    const newDocuments = selectedContext.documents.includes(id)
      ? selectedContext.documents.filter(d => d !== id)
      : [...selectedContext.documents, id];
    onContextChange({ ...selectedContext, documents: newDocuments });
  };

  const clearAll = () => {
    onContextChange({ tasks: [], decisions: [], documents: [] });
  };

  const totalSelected = selectedContext.tasks.length + selectedContext.decisions.length + selectedContext.documents.length;

  const visibleTasks = tasks.filter((t) => {
    const s = String((t as any).status || "").toLowerCase();
    return s !== "done" && s !== "completed" && s !== "closed";
  });

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium text-sm">Add Context</span>
            <span className="text-xs text-muted-foreground">Selected items will be included in the next message.</span>
          </div>
          {totalSelected > 0 && (
            <Badge variant="secondary">{totalSelected} selected</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {totalSelected > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="w-4 h-4 text-info" />
              <span className="text-sm font-medium">Tasks</span>
              <Badge variant="outline" className="ml-auto">{visibleTasks.length}</Badge>
            </div>
            {visibleTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks available</p>
            ) : (
              <div className="space-y-2">
                {visibleTasks.slice(0, 10).map((task) => (
                  <label
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                      selectedContext.tasks.includes(task.id) && "bg-accent"
                    )}
                  >
                    <Checkbox
                      checked={selectedContext.tasks.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.status} • {task.priority}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {/* Decisions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Decisions</span>
              <Badge variant="outline" className="ml-auto">{decisions.length}</Badge>
            </div>
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions available</p>
            ) : (
              <div className="space-y-2">
                {decisions.slice(0, 10).map((decision) => (
                  <label
                    key={decision.id}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                      selectedContext.decisions.includes(decision.id) && "bg-accent"
                    )}
                  >
                    <Checkbox
                      checked={selectedContext.decisions.includes(decision.id)}
                      onCheckedChange={() => toggleDecision(decision.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{decision.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {decision.status} • {decision.impact} impact
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {/* Documents */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Documents</span>
              <Badge variant="outline" className="ml-auto">{documents.length}</Badge>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents available</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 10).map((doc) => (
                  <label
                    key={doc.id}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                      selectedContext.documents.includes(doc.id) && "bg-accent"
                    )}
                  >
                    <Checkbox
                      checked={selectedContext.documents.includes(doc.id)}
                      onCheckedChange={() => toggleDocument(doc.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        v{doc.version} • {doc.is_pinned ? 'Pinned' : 'Not pinned'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Selected context will be included in AI responses for more relevant answers.
        </p>
      </div>
    </div>
  );
}
