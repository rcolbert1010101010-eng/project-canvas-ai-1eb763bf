import { Lightbulb, CheckSquare, FileText, Archive, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ActivityLog } from '@/types';

const mockActivities: ActivityLog[] = [
  { id: '1', project_id: '1', type: 'decision_created', entity_id: '1', entity_type: 'decision', description: 'Recorded decision: "Use PostgreSQL for primary database"', created_at: '2024-01-15T14:30:00' },
  { id: '2', project_id: '1', type: 'task_status_changed', entity_id: '1', entity_type: 'task', description: 'Task "Implement user authentication" moved to In Progress', created_at: '2024-01-15T12:15:00' },
  { id: '3', project_id: '1', type: 'document_edited', entity_id: '1', entity_type: 'document', description: 'Updated "Architecture Overview" (v2 → v3)', created_at: '2024-01-15T10:45:00' },
  { id: '4', project_id: '1', type: 'decision_created', entity_id: '2', entity_type: 'decision', description: 'Recorded decision: "Adopt TypeScript for all new code"', created_at: '2024-01-14T16:20:00' },
  { id: '5', project_id: '1', type: 'conversation_archived', entity_id: '4', entity_type: 'conversation', description: 'Archived conversation: "API Design Review"', created_at: '2024-01-14T14:00:00' },
  { id: '6', project_id: '1', type: 'task_status_changed', entity_id: '2', entity_type: 'task', description: 'Task "Design database schema" marked as Blocked', created_at: '2024-01-14T11:30:00' },
  { id: '7', project_id: '1', type: 'document_edited', entity_id: '2', entity_type: 'document', description: 'Updated "API Specification" (v6 → v7)', created_at: '2024-01-14T09:15:00' },
  { id: '8', project_id: '1', type: 'task_status_changed', entity_id: '5', entity_type: 'task', description: 'Task "Configure Tailwind CSS theme" marked as Done', created_at: '2024-01-11T17:45:00' },
];

const activityConfig: Record<ActivityLog['type'], { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  decision_created: { icon: Lightbulb, color: 'text-success', bgColor: 'bg-success/10' },
  task_status_changed: { icon: CheckSquare, color: 'text-info', bgColor: 'bg-info/10' },
  document_edited: { icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10' },
  conversation_archived: { icon: Archive, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export function ActivityView() {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group activities by date
  const groupedActivities = mockActivities.reduce((acc, activity) => {
    const dateKey = new Date(activity.created_at).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(activity);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  return (
    <div className="p-6 animate-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Activity Timeline</h2>
        <p className="text-sm text-muted-foreground">Track changes across your project</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockActivities.filter(a => a.type === 'decision_created').length}</p>
              <p className="text-xs text-muted-foreground">Decisions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockActivities.filter(a => a.type === 'task_status_changed').length}</p>
              <p className="text-xs text-muted-foreground">Task Updates</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockActivities.filter(a => a.type === 'document_edited').length}</p>
              <p className="text-xs text-muted-foreground">Doc Edits</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Archive className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockActivities.filter(a => a.type === 'conversation_archived').length}</p>
              <p className="text-xs text-muted-foreground">Archived</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([dateKey, activities]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{formatDate(activities[0].created_at)}</Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                  
                  <div className="space-y-4">
                    {activities.map((activity, index) => {
                      const config = activityConfig[activity.type];
                      const Icon = config.icon;
                      
                      return (
                        <div 
                          key={activity.id}
                          className="relative flex items-start gap-4 pl-0"
                        >
                          <div className={cn(
                            "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            config.bgColor
                          )}>
                            <Icon className={cn("w-5 h-5", config.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-sm text-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(activity.created_at)}
                            </p>
                          </div>
                          
                          <div className="shrink-0 pt-1.5">
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
