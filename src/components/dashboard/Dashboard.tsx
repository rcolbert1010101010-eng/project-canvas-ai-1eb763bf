import { MessageSquare, CheckSquare, Lightbulb, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';
import { useTasks } from '@/hooks/useTasks';
import { useDecisions } from '@/hooks/useDecisions';
import { useDocuments } from '@/hooks/useDocuments';

interface DashboardProps {
  projectId: string;
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'todo': return 'todo' as const;
    case 'in_progress': return 'in-progress' as const;
    case 'blocked': return 'blocked' as const;
    case 'done': return 'done' as const;
    default: return 'secondary' as const;
  }
};

const priorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'low': return 'priority-low' as const;
    case 'medium': return 'priority-medium' as const;
    case 'high': return 'priority-high' as const;
    default: return 'secondary' as const;
  }
};

export function Dashboard({ projectId }: DashboardProps) {
  const { data: conversations } = useConversations(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: decisions } = useDecisions(projectId);
  const { data: documents } = useDocuments(projectId);

  const activeConversations = conversations?.filter(c => !c.is_archived) || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const blockedTasks = tasks?.filter(t => t.status === 'blocked') || [];
  const acceptedDecisions = decisions?.filter(d => d.status === 'accepted') || [];
  const pinnedDocs = documents?.filter(d => d.is_pinned) || [];

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Conversations"
          value={activeConversations.length}
          subtitle={`${conversations?.filter(c => c.is_archived).length || 0} archived`}
          icon={MessageSquare}
          variant="primary"
        />
        <StatsCard
          title="Open Tasks"
          value={tasks?.filter(t => t.status !== 'done').length || 0}
          subtitle={`${blockedTasks.length} blocked`}
          icon={CheckSquare}
          variant="warning"
        />
        <StatsCard
          title="Decisions Made"
          value={acceptedDecisions.length}
          subtitle="Accepted"
          icon={Lightbulb}
          variant="success"
        />
        <StatsCard
          title="Documents"
          value={documents?.length || 0}
          subtitle={`${pinnedDocs.length} pinned`}
          icon={FileText}
          variant="info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>What Should I Work On?</CardTitle>
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgressTasks.length === 0 && blockedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks in progress. Create some tasks to get started!</p>
              </div>
            ) : (
              <>
                {inProgressTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={statusBadgeVariant(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={priorityBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                        {task.next_action && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="text-primary">Next:</span> {task.next_action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {blockedTasks.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-destructive mb-3">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Blocked Tasks</span>
                    </div>
                    {blockedTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                            <p className="text-sm text-destructive mt-1">
                              <span className="font-medium">Blocked:</span> {task.blocked_reason || 'No reason specified'}
                            </p>
                          </div>
                          <Badge variant={priorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Decisions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-success" />
              <CardTitle>Recent Decisions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {decisions?.slice(0, 3).map((decision) => (
              <div 
                key={decision.id}
                className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-success/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={decision.status}>{decision.status}</Badge>
                  <Badge variant={`impact-${decision.impact}` as const}>{decision.impact} impact</Badge>
                </div>
                <h4 className="font-medium text-foreground text-sm">{decision.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{decision.rationale}</p>
              </div>
            )) || (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No decisions recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Conversations */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-info" />
            <CardTitle>Active Conversations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">New Conversation</Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeConversations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeConversations.slice(0, 4).map((conv) => (
                <div 
                  key={conv.id}
                  className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-info/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="info">{conv.mode}</Badge>
                        <span className="text-xs text-muted-foreground">{conv.message_count || 0} messages</span>
                      </div>
                      <h4 className="font-medium text-foreground">{conv.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{conv.purpose}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm">Continue</Button>
                    <Button variant="ghost" size="sm">Archive</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active conversations. Start a new one to begin!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
