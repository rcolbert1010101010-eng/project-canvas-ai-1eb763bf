import { MessageSquare, CheckSquare, Lightbulb, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task, Decision, Conversation } from '@/types';

// Mock data for demo
const mockTasks: Task[] = [
  { id: '1', project_id: '1', conversation_id: '1', title: 'Implement user authentication flow', description: 'Set up OAuth and session management', next_action: 'Research OAuth providers', status: 'in_progress', blocked_reason: null, priority: 'high', created_at: '2024-01-15', updated_at: '2024-01-15' },
  { id: '2', project_id: '1', conversation_id: '1', title: 'Design database schema', description: 'Create ERD for core entities', next_action: 'Review with team', status: 'blocked', blocked_reason: 'Waiting for requirements', priority: 'high', created_at: '2024-01-14', updated_at: '2024-01-14' },
  { id: '3', project_id: '1', conversation_id: null, title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions', next_action: null, status: 'todo', blocked_reason: null, priority: 'medium', created_at: '2024-01-13', updated_at: '2024-01-13' },
];

const mockDecisions: Decision[] = [
  { id: '1', project_id: '1', conversation_id: '1', title: 'Use PostgreSQL for primary database', decision: 'PostgreSQL over MongoDB', rationale: 'Better for relational data and complex queries', status: 'accepted', impact: 'high', supersedes_decision_id: null, created_at: '2024-01-15' },
  { id: '2', project_id: '1', conversation_id: '2', title: 'Adopt TypeScript for all new code', decision: 'TypeScript mandatory', rationale: 'Type safety and better DX', status: 'accepted', impact: 'high', supersedes_decision_id: null, created_at: '2024-01-14' },
];

const mockConversations: Conversation[] = [
  { id: '1', project_id: '1', title: 'Architecture Planning Session', purpose: 'Define system architecture', summary: null, is_archived: false, mode: 'design', created_at: '2024-01-15', message_count: 24 },
  { id: '2', project_id: '1', title: 'Debugging Auth Issues', purpose: 'Fix login failures', summary: null, is_archived: false, mode: 'debug', created_at: '2024-01-14', message_count: 18 },
];

const statusBadgeVariant = (status: Task['status']) => {
  switch (status) {
    case 'todo': return 'todo';
    case 'in_progress': return 'in-progress';
    case 'blocked': return 'blocked';
    case 'done': return 'done';
  }
};

const priorityBadgeVariant = (priority: Task['priority']) => {
  switch (priority) {
    case 'low': return 'priority-low';
    case 'medium': return 'priority-medium';
    case 'high': return 'priority-high';
  }
};

export function Dashboard() {
  const inProgressTasks = mockTasks.filter(t => t.status === 'in_progress');
  const blockedTasks = mockTasks.filter(t => t.status === 'blocked');

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Conversations"
          value={mockConversations.filter(c => !c.is_archived).length}
          subtitle="2 need attention"
          icon={MessageSquare}
          variant="primary"
        />
        <StatsCard
          title="Open Tasks"
          value={mockTasks.filter(t => t.status !== 'done').length}
          subtitle={`${blockedTasks.length} blocked`}
          icon={CheckSquare}
          variant="warning"
        />
        <StatsCard
          title="Decisions Made"
          value={mockDecisions.filter(d => d.status === 'accepted').length}
          subtitle="This week"
          icon={Lightbulb}
          variant="success"
        />
        <StatsCard
          title="Documents"
          value={4}
          subtitle="2 pinned"
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
                          <span className="font-medium">Blocked:</span> {task.blocked_reason}
                        </p>
                      </div>
                      <Badge variant="priority-high">{task.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
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
            {mockDecisions.map((decision) => (
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
            ))}
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
            <Button variant="ghost" size="sm">View Archived</Button>
            <Button variant="outline" size="sm">New Conversation</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockConversations.filter(c => !c.is_archived).map((conv) => (
              <div 
                key={conv.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border hover:border-info/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">{conv.mode}</Badge>
                      <span className="text-xs text-muted-foreground">{conv.message_count} messages</span>
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
        </CardContent>
      </Card>
    </div>
  );
}
