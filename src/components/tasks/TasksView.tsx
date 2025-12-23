import { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, Filter, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, Priority } from '@/types';

const mockTasks: Task[] = [
  { id: '1', project_id: '1', conversation_id: '1', title: 'Implement user authentication flow', description: 'Set up OAuth with Google and GitHub providers, implement session management', next_action: 'Research OAuth providers and compare options', status: 'in_progress', blocked_reason: null, priority: 'high', created_at: '2024-01-15', updated_at: '2024-01-15' },
  { id: '2', project_id: '1', conversation_id: '1', title: 'Design database schema for users', description: 'Create ERD for user-related entities including profiles, preferences, and permissions', next_action: 'Review with team lead', status: 'blocked', blocked_reason: 'Waiting for requirements from product team', priority: 'high', created_at: '2024-01-14', updated_at: '2024-01-14' },
  { id: '3', project_id: '1', conversation_id: null, title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', next_action: null, status: 'todo', blocked_reason: null, priority: 'medium', created_at: '2024-01-13', updated_at: '2024-01-13' },
  { id: '4', project_id: '1', conversation_id: '2', title: 'Write API documentation', description: 'Document all REST endpoints using OpenAPI spec', next_action: null, status: 'todo', blocked_reason: null, priority: 'low', created_at: '2024-01-12', updated_at: '2024-01-12' },
  { id: '5', project_id: '1', conversation_id: '1', title: 'Configure Tailwind CSS theme', description: 'Set up custom color palette and design tokens', next_action: null, status: 'done', blocked_reason: null, priority: 'medium', created_at: '2024-01-10', updated_at: '2024-01-11' },
  { id: '6', project_id: '1', conversation_id: null, title: 'Set up error monitoring', description: 'Integrate Sentry for error tracking and alerting', next_action: null, status: 'done', blocked_reason: null, priority: 'high', created_at: '2024-01-09', updated_at: '2024-01-10' },
];

const statusConfig: Record<TaskStatus, { icon: React.ComponentType<{ className?: string }>; label: string; variant: 'todo' | 'in-progress' | 'blocked' | 'done' }> = {
  todo: { icon: Circle, label: 'To Do', variant: 'todo' },
  in_progress: { icon: Clock, label: 'In Progress', variant: 'in-progress' },
  blocked: { icon: AlertCircle, label: 'Blocked', variant: 'blocked' },
  done: { icon: CheckCircle2, label: 'Done', variant: 'done' },
};

const statusOrder: TaskStatus[] = ['in_progress', 'blocked', 'todo', 'done'];

export function TasksView() {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const groupedTasks = statusOrder.reduce((acc, status) => {
    acc[status] = mockTasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const filteredTasks = filter === 'all' 
    ? mockTasks 
    : mockTasks.filter(t => t.status === filter);

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
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  
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
                    <Button variant="outline" size="sm">Edit</Button>
                    {task.status !== 'done' && (
                      <Button variant="success" size="sm">Mark Done</Button>
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

  return (
    <div className="p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-muted-foreground">{mockTasks.length} total tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="glow" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({mockTasks.length})
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
    </div>
  );
}
