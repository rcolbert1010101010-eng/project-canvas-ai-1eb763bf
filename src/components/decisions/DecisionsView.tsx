import { useState } from 'react';
import { Lightbulb, CheckCircle, XCircle, Clock, Link2, ArrowRight, Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Decision, DecisionStatus, Impact } from '@/types';

const mockDecisions: Decision[] = [
  { 
    id: '1', 
    project_id: '1', 
    conversation_id: '1', 
    title: 'Use PostgreSQL for primary database', 
    decision: 'PostgreSQL will be our primary database for all structured data', 
    rationale: 'PostgreSQL offers excellent support for complex queries, transactions, and JSON data. It integrates well with our ORM choice and provides robust full-text search capabilities.', 
    status: 'accepted', 
    impact: 'high', 
    supersedes_decision_id: null, 
    created_at: '2024-01-15' 
  },
  { 
    id: '2', 
    project_id: '1', 
    conversation_id: '1', 
    title: 'Adopt TypeScript for all new code', 
    decision: 'TypeScript is mandatory for all new frontend and backend code', 
    rationale: 'Type safety reduces runtime errors, improves IDE support, and makes refactoring safer. The team has sufficient TypeScript experience.', 
    status: 'accepted', 
    impact: 'high', 
    supersedes_decision_id: null, 
    created_at: '2024-01-14' 
  },
  { 
    id: '3', 
    project_id: '1', 
    conversation_id: '2', 
    title: 'Use REST over GraphQL for API', 
    decision: 'REST API architecture for all public and internal endpoints', 
    rationale: 'GraphQL adds complexity without significant benefits for our use case. REST is well-understood by the team and has better caching support.', 
    status: 'accepted', 
    impact: 'medium', 
    supersedes_decision_id: null, 
    created_at: '2024-01-13' 
  },
  { 
    id: '4', 
    project_id: '1', 
    conversation_id: '3', 
    title: 'Implement feature flags with LaunchDarkly', 
    decision: 'Use LaunchDarkly for feature flag management', 
    rationale: 'Enables gradual rollouts, A/B testing, and quick feature toggles without deployment', 
    status: 'proposed', 
    impact: 'medium', 
    supersedes_decision_id: null, 
    created_at: '2024-01-12' 
  },
  { 
    id: '5', 
    project_id: '1', 
    conversation_id: null, 
    title: 'Use MongoDB for analytics data', 
    decision: 'MongoDB as secondary database for analytics and event data', 
    rationale: 'Initially considered for flexible schema, but decided PostgreSQL with JSONB is sufficient.', 
    status: 'deprecated', 
    impact: 'medium', 
    supersedes_decision_id: '1', 
    created_at: '2024-01-10' 
  },
];

const statusConfig: Record<DecisionStatus, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  proposed: { icon: Clock, label: 'Proposed', color: 'text-warning' },
  accepted: { icon: CheckCircle, label: 'Accepted', color: 'text-success' },
  deprecated: { icon: XCircle, label: 'Deprecated', color: 'text-muted-foreground' },
};

export function DecisionsView() {
  const [filter, setFilter] = useState<DecisionStatus | 'all'>('all');
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);

  const filteredDecisions = filter === 'all'
    ? mockDecisions
    : mockDecisions.filter(d => d.status === filter);

  const counts = {
    all: mockDecisions.length,
    proposed: mockDecisions.filter(d => d.status === 'proposed').length,
    accepted: mockDecisions.filter(d => d.status === 'accepted').length,
    deprecated: mockDecisions.filter(d => d.status === 'deprecated').length,
  };

  const DecisionCard = ({ decision }: { decision: Decision }) => {
    const StatusIcon = statusConfig[decision.status].icon;
    const isExpanded = expandedDecision === decision.id;
    
    return (
      <Card 
        variant="interactive"
        className={cn(
          "transition-all duration-200",
          isExpanded && "ring-2 ring-primary/30",
          decision.status === 'deprecated' && "opacity-60"
        )}
        onClick={() => setExpandedDecision(isExpanded ? null : decision.id)}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              decision.status === 'accepted' && "bg-success/10",
              decision.status === 'proposed' && "bg-warning/10",
              decision.status === 'deprecated' && "bg-muted"
            )}>
              <Lightbulb className={cn(
                "w-5 h-5",
                statusConfig[decision.status].color
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={decision.status}>{statusConfig[decision.status].label}</Badge>
                <Badge variant={`impact-${decision.impact}` as const}>{decision.impact} impact</Badge>
              </div>
              
              <h4 className={cn(
                "font-medium text-foreground",
                decision.status === 'deprecated' && "line-through text-muted-foreground"
              )}>
                {decision.title}
              </h4>
              
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {decision.decision}
              </p>
              
              {isExpanded && (
                <div className="mt-4 space-y-4 animate-in">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rationale</span>
                    <p className="text-sm text-foreground mt-1">{decision.rationale}</p>
                  </div>
                  
                  {decision.supersedes_decision_id && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2 className="w-4 h-4" />
                      <span>Superseded by another decision</span>
                    </div>
                  )}
                  
                  {decision.conversation_id && (
                    <div className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                      <ArrowRight className="w-4 h-4" />
                      <span>View source conversation</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {decision.status === 'proposed' && (
                      <>
                        <Button variant="success" size="sm">Accept</Button>
                        <Button variant="outline" size="sm">Reject</Button>
                      </>
                    )}
                    {decision.status === 'accepted' && (
                      <Button variant="outline" size="sm">Mark Deprecated</Button>
                    )}
                    <Button variant="ghost" size="sm">Edit</Button>
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
          <h2 className="text-xl font-semibold text-foreground">Decisions</h2>
          <p className="text-sm text-muted-foreground">Architectural decisions and their rationale</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="glow" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Record Decision
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.accepted}</p>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.proposed}</p>
              <p className="text-sm text-muted-foreground">Proposed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{counts.deprecated}</p>
              <p className="text-sm text-muted-foreground">Deprecated</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'accepted', 'proposed', 'deprecated'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status].label} ({counts[status]})
          </Button>
        ))}
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {filteredDecisions.map((decision) => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
      </div>
    </div>
  );
}
