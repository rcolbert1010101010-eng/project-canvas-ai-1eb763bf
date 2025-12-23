import { AlertTriangle, CheckCircle, Info, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConversationHealthProps {
  messageCount: number;
  onArchive?: () => void;
  compact?: boolean;
}

const THRESHOLDS = {
  healthy: 20,
  warning: 40,
  critical: 60,
};

export function ConversationHealth({ messageCount, onArchive, compact = false }: ConversationHealthProps) {
  const getHealthStatus = () => {
    if (messageCount < THRESHOLDS.healthy) {
      return { status: 'healthy', label: 'Healthy', color: 'text-success', bgColor: 'bg-success' };
    }
    if (messageCount < THRESHOLDS.warning) {
      return { status: 'warning', label: 'Getting Long', color: 'text-warning', bgColor: 'bg-warning' };
    }
    if (messageCount < THRESHOLDS.critical) {
      return { status: 'critical', label: 'Consider Archiving', color: 'text-destructive', bgColor: 'bg-destructive' };
    }
    return { status: 'overdue', label: 'Archive Recommended', color: 'text-destructive', bgColor: 'bg-destructive' };
  };

  const health = getHealthStatus();
  const progressValue = Math.min((messageCount / THRESHOLDS.critical) * 100, 100);

  const getIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <Info className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRecommendation = () => {
    switch (health.status) {
      case 'healthy':
        return 'Conversation is at a good length for context retention.';
      case 'warning':
        return 'Consider extracting key decisions and summarizing progress.';
      case 'critical':
        return 'Long conversations may lose context. Archive and start fresh.';
      case 'overdue':
        return 'This conversation is very long. Archive it to preserve context quality.';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', health.color)}>
              {getIcon()}
              <span className="text-xs">{messageCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', health.color)}>{health.label}</span>
                <span className="text-muted-foreground text-xs">({messageCount} messages)</span>
              </div>
              <p className="text-xs text-muted-foreground">{getRecommendation()}</p>
              {(health.status === 'critical' || health.status === 'overdue') && onArchive && (
                <Button size="sm" variant="secondary" className="w-full mt-2" onClick={onArchive}>
                  <Archive className="w-3 h-3 mr-1" />
                  Archive Now
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={health.color}>{getIcon()}</span>
          <span className="text-sm font-medium">{health.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{messageCount} / {THRESHOLDS.critical} messages</span>
      </div>
      
      <Progress value={progressValue} className="h-2" indicatorClassName={health.bgColor} />
      
      <p className="text-xs text-muted-foreground">{getRecommendation()}</p>
      
      {(health.status === 'critical' || health.status === 'overdue') && onArchive && (
        <Button size="sm" variant="secondary" className="w-full" onClick={onArchive}>
          <Archive className="w-4 h-4 mr-2" />
          Archive Conversation
        </Button>
      )}
    </div>
  );
}
