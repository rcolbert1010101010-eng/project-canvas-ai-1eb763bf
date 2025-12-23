import { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, Filter, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTasks, useCreateTask, useUpdateTask, type Task } from '@/hooks/useTasks';
import type { Database } from '@/integrations/supabase/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type Priority = Database['public']['Enums']['priority_level'];

const statusConfig: Record<TaskStatus, { icon: React.ComponentType<{ className?: string }>; label: string; variant: 'todo' | 'in-progress' | 'blocked' | 'done' }> = {
  todo: { icon: Circle, label: 'To Do', variant: 'todo' },
  in_progress: { icon: Clock, label: 'In Progress', variant: 'in-progress' },
  blocked: { icon: AlertCircle, label: 'Blocked', variant: 'blocked' },
  done: { icon: CheckCircle2, label: 'Done', variant: 'done' },
};

const statusOrder: TaskStatus[] = ['in_progress', 'blocked', 'todo', 'done'];

interface TasksViewProps {
  projectId: string;
}

export function TasksView({ projectId }: TasksViewProps) {
  const { data: tasks, isLoading } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  const groupedTasks = statusOrder.reduce((acc, status) => {
    acc[status] = tasks?.filter(t => t.status === status) || [];
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    
    await createTask.mutateAsync({
      project_id: projectId,
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority,
    });
    
    setShowNewDialog(false);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask.mutateAsync({ id: taskId, status: newStatus });
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusConfig[task.status].icon;
    const isExpanded = expandedTask === task.id;
    
    return (
      <Card 
        variant="interactive"
        className={cn(
          "transition-all duration-200",
          isExpanded && "ring-2 ring-primary/30"
        )}
        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <StatusIcon className={cn(
              "w-5 h-5 mt-0.5 shrink-0",
              task.status === 'done' && "text-success",
              task.status === 'in_progress' && "text-info",
              task.status === 'blocked' && "text-destructive",
              task.status === 'todo' && "text-muted-foreground"
            )} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  "font-medium truncate",
                  task.status === 'done' && "text-muted-foreground line-through"
                )}>
                  {task.title}
                </h4>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                  isExpanded && "rotate-90"
                )} />
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig[task.status].variant}>
                  {statusConfig[task.status].label}
                </Badge>
                <Badge variant={`priority-${task.priority}` as const}>
                  {task.priority}
                </Badge>
              </div>
              
              {isExpanded && (
                <div className="mt-4 space-y-3 animate-in">
                  <p className="text-sm text-muted-foreground">{task.description || 'No description'}</p>
                  
                  {task.next_action && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-xs font-medium text-primary">Next Action</span>
                      <p className="text-sm text-foreground mt-1">{task.next_action}</p>
                    </div>
                  )}
                  
                  {task.blocked_reason && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <span className="text-xs font-medium text-destructive">Blocked Reason</span>
                      <p className="text-sm text-foreground mt-1">{task.blocked_reason}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2">
                    {task.status !== 'done' && (
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'done');
                        }}
                      >
                        Mark Done
                      </Button>
                    )}
                    {task.status === 'todo' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, 'in_progress');
                        }}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-muted-foreground">{tasks?.length || 0} total tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button variant="glow" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Implement user authentication"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed task description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="glow"
                  className="w-full"
                  onClick={handleCreateTask}
                  disabled={!newTitle.trim() || createTask.isPending}
                >
                  {createTask.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({tasks?.length || 0})
        </Button>
        {statusOrder.map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {statusConfig[status].label} ({groupedTasks[status].length})
          </Button>
        ))}
      </div>

      {/* Task Columns */}
      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {statusOrder.map((status) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={statusConfig[status].variant} className="text-xs">
                  {statusConfig[status].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {groupedTasks[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {groupedTasks[status].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {groupedTasks[status].length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No tasks yet</h4>
          <p className="text-muted-foreground mb-4">Create your first task to start tracking work.</p>
          <Button variant="glow" onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Task
          </Button>
        </div>
      )}
    </div>
  );
}
