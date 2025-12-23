import { useState } from 'react';
import { Lightbulb, CheckCircle, XCircle, Clock, Link2, ArrowRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDecisions, useCreateDecision, useUpdateDecision, type Decision } from '@/hooks/useDecisions';
import type { Database } from '@/integrations/supabase/types';

type DecisionStatus = Database['public']['Enums']['decision_status'];
type Impact = Database['public']['Enums']['impact_level'];

const statusConfig: Record<DecisionStatus, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  proposed: { icon: Clock, label: 'Proposed', color: 'text-warning' },
  accepted: { icon: CheckCircle, label: 'Accepted', color: 'text-success' },
  deprecated: { icon: XCircle, label: 'Deprecated', color: 'text-muted-foreground' },
};

interface DecisionsViewProps {
  projectId: string;
}

export function DecisionsView({ projectId }: DecisionsViewProps) {
  const { data: decisions, isLoading } = useDecisions(projectId);
  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  
  const [filter, setFilter] = useState<DecisionStatus | 'all'>('all');
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newImpact, setNewImpact] = useState<Impact>('medium');

  const filteredDecisions = filter === 'all'
    ? decisions
    : decisions?.filter(d => d.status === filter);

  const counts = {
    all: decisions?.length || 0,
    proposed: decisions?.filter(d => d.status === 'proposed').length || 0,
    accepted: decisions?.filter(d => d.status === 'accepted').length || 0,
    deprecated: decisions?.filter(d => d.status === 'deprecated').length || 0,
  };

  const handleCreateDecision = async () => {
    if (!newTitle.trim() || !newDecision.trim()) return;
    
    await createDecision.mutateAsync({
      project_id: projectId,
      title: newTitle,
      decision: newDecision,
      rationale: newRationale || undefined,
      impact: newImpact,
    });
    
    setShowNewDialog(false);
    setNewTitle('');
    setNewDecision('');
    setNewRationale('');
    setNewImpact('medium');
  };

  const handleStatusChange = async (id: string, status: DecisionStatus) => {
    await updateDecision.mutateAsync({ id, status });
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
                    <p className="text-sm text-foreground mt-1">{decision.rationale || 'No rationale provided'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {decision.status === 'proposed' && (
                      <>
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(decision.id, 'accepted');
                          }}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(decision.id, 'deprecated');
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {decision.status === 'accepted' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(decision.id, 'deprecated');
                        }}
                      >
                        Mark Deprecated
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
        <div className="animate-pulse text-muted-foreground">Loading decisions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Decisions</h2>
          <p className="text-sm text-muted-foreground">Architectural decisions and their rationale</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button variant="glow" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Record Decision
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Decision</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Use PostgreSQL for primary database"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decision">Decision</Label>
                  <Textarea
                    id="decision"
                    placeholder="What was decided..."
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rationale">Rationale (optional)</Label>
                  <Textarea
                    id="rationale"
                    placeholder="Why this decision was made..."
                    value={newRationale}
                    onChange={(e) => setNewRationale(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impact">Impact</Label>
                  <Select value={newImpact} onValueChange={(v) => setNewImpact(v as Impact)}>
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
                  onClick={handleCreateDecision}
                  disabled={!newTitle.trim() || !newDecision.trim() || createDecision.isPending}
                >
                  {createDecision.isPending ? 'Recording...' : 'Record Decision'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              <p className="text-xs text-muted-foreground">Accepted</p>
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
              <p className="text-xs text-muted-foreground">Proposed</p>
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
              <p className="text-xs text-muted-foreground">Deprecated</p>
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
      {filteredDecisions && filteredDecisions.length > 0 ? (
        <div className="space-y-4">
          {filteredDecisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No decisions recorded</h4>
          <p className="text-muted-foreground mb-4">Record your first architectural decision.</p>
          <Button variant="glow" onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Record First Decision
          </Button>
        </div>
      )}
    </div>
  );
}
