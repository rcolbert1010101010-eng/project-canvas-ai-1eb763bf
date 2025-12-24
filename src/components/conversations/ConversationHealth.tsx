import { AlertTriangle, CheckCircle, Info, Archive, ListTodo, Lightbulb, Plus, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ExtractionType = 'task' | 'decision' | 'document' | 'auto';

interface ConversationHealthProps {
  messageCount: number;
  hasSummary?: boolean;
  onArchive?: () => void;
  onExtract?: (type: ExtractionType) => void;
  onNewConversation?: () => void;
  onGenerateSummary?: () => void;
  compact?: boolean;
  showBanner?: boolean;
}

const THRESHOLDS = {
  healthy: 20,
  gettingLong: 40,
  considerArchiving: 60,
  archiveRecommended: 60,
};

type HealthStatus = 'healthy' | 'getting-long' | 'consider-archiving' | 'archive-recommended';

interface HealthInfo {
  status: HealthStatus;
  label: string;
  color: string;
  bgColor: string;
  indicatorColor: string;
}

export function ConversationHealth({ 
  messageCount, 
  hasSummary = false,
  onArchive, 
  onExtract,
  onNewConversation,
  onGenerateSummary,
  compact = false,
  showBanner = true,
}: ConversationHealthProps) {
  
  const getHealthStatus = (): HealthInfo => {
    if (messageCount < THRESHOLDS.healthy) {
      return { 
        status: 'healthy', 
        label: 'Healthy', 
        color: 'text-emerald-500', 
        bgColor: 'bg-emerald-500/10',
        indicatorColor: 'bg-emerald-500',
      };
    }
    if (messageCount < THRESHOLDS.gettingLong) {
      return { 
        status: 'getting-long', 
        label: 'Getting Long', 
        color: 'text-yellow-500', 
        bgColor: 'bg-yellow-500/10',
        indicatorColor: 'bg-yellow-500',
      };
    }
    if (messageCount < THRESHOLDS.considerArchiving) {
      return { 
        status: 'consider-archiving', 
        label: 'Consider Archiving', 
        color: 'text-orange-500', 
        bgColor: 'bg-orange-500/10',
        indicatorColor: 'bg-orange-500',
      };
    }
    return { 
      status: 'archive-recommended', 
      label: 'Archive Recommended', 
      color: 'text-red-500', 
      bgColor: 'bg-red-500/10',
      indicatorColor: 'bg-red-500',
    };
  };

  const health = getHealthStatus();
  const progressValue = Math.min((messageCount / THRESHOLDS.archiveRecommended) * 100, 100);
  const showActions = health.status === 'consider-archiving' || health.status === 'archive-recommended';
  const showSummarySuggestion = messageCount >= THRESHOLDS.archiveRecommended && !hasSummary && onGenerateSummary;

  const getIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'getting-long':
        return <Info className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRecommendation = () => {
    switch (health.status) {
      case 'healthy':
        return 'Conversation is at a good length for context retention.';
      case 'getting-long':
        return 'Consider extracting key decisions and tasks soon.';
      case 'consider-archiving':
        return 'Extract important items and archive to maintain AI quality.';
      case 'archive-recommended':
        return 'Long conversations degrade AI context. Archive and start fresh.';
    }
  };

  // Compact view for header display
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1 cursor-pointer', health.color)}>
              {getIcon()}
              <span className="text-xs font-medium">{messageCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm p-0" sideOffset={8}>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium text-sm', health.color)}>{health.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{messageCount} messages</span>
              </div>
              
              <Progress value={progressValue} className="h-1.5" indicatorClassName={health.indicatorColor} />
              
              <p className="text-xs text-muted-foreground">{getRecommendation()}</p>
              
              {showActions && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="text-xs font-medium text-foreground">Quick Actions:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {onExtract && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs justify-start px-2"
                          onClick={() => onExtract('task')}
                        >
                          <ListTodo className="w-3 h-3 mr-1.5" />
                          Extract Tasks
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs justify-start px-2"
                          onClick={() => onExtract('decision')}
                        >
                          <Lightbulb className="w-3 h-3 mr-1.5" />
                          Extract Decisions
                        </Button>
                      </>
                    )}
                    {onArchive && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs justify-start px-2"
                        onClick={onArchive}
                      >
                        <Archive className="w-3 h-3 mr-1.5" />
                        Summarize & Archive
                      </Button>
                    )}
                    {onNewConversation && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs justify-start px-2"
                        onClick={onNewConversation}
                      >
                        <Plus className="w-3 h-3 mr-1.5" />
                        New Conversation
                      </Button>
                    )}
                  </div>
                  
                  {showSummarySuggestion && (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="w-full h-7 text-xs mt-1"
                      onClick={onGenerateSummary}
                    >
                      <Sparkles className="w-3 h-3 mr-1.5" />
                      Generate AI Summary
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full card view
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={health.color}>{getIcon()}</span>
          <span className="text-sm font-medium">{health.label}</span>
        </div>
        <span className="text-xs text-muted-foreground">{messageCount} / {THRESHOLDS.archiveRecommended} messages</span>
      </div>
      
      <Progress value={progressValue} className="h-2" indicatorClassName={health.indicatorColor} />
      
      <p className="text-xs text-muted-foreground">{getRecommendation()}</p>
      
      {showActions && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {onExtract && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onExtract('task')}
              >
                <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                Extract Tasks
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onExtract('decision')}
              >
                <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                Extract Decisions
              </Button>
            </>
          )}
          {onArchive && (
            <Button 
              size="sm" 
              variant="secondary" 
              className="text-xs"
              onClick={onArchive}
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Summarize & Archive
            </Button>
          )}
          {onNewConversation && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs"
              onClick={onNewConversation}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Conversation
            </Button>
          )}
        </div>
      )}
      
      {showSummarySuggestion && (
        <Button 
          size="sm" 
          variant="secondary" 
          className="w-full text-xs"
          onClick={onGenerateSummary}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Generate AI Summary (Recommended)
        </Button>
      )}
    </div>
  );
}

// Standalone banner component for persistent display in chat
interface HealthBannerProps {
  messageCount: number;
  hasSummary?: boolean;
  onArchive?: () => void;
  onExtract?: (type: ExtractionType) => void;
  onNewConversation?: () => void;
  onDismiss?: () => void;
}

export function ConversationHealthBanner({
  messageCount,
  hasSummary = false,
  onArchive,
  onExtract,
  onNewConversation,
  onDismiss,
}: HealthBannerProps) {
  // Only show for orange/red states
  if (messageCount < THRESHOLDS.gettingLong) {
    return null;
  }

  const isArchiveRecommended = messageCount >= THRESHOLDS.archiveRecommended;
  const isConsiderArchiving = messageCount >= THRESHOLDS.considerArchiving;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 border-b",
      isArchiveRecommended 
        ? "bg-red-500/10 border-red-500/20" 
        : isConsiderArchiving 
          ? "bg-orange-500/10 border-orange-500/20"
          : "bg-yellow-500/10 border-yellow-500/20"
    )}>
      <AlertTriangle className={cn(
        "w-4 h-4 shrink-0",
        isArchiveRecommended ? "text-red-500" : isConsiderArchiving ? "text-orange-500" : "text-yellow-500"
      )} />
      
      <span className="text-xs text-foreground flex-1">
        {isArchiveRecommended 
          ? "This conversation is very long. Archive to maintain AI quality."
          : isConsiderArchiving
            ? "Consider archiving this conversation soon."
            : "Conversation is getting long. Extract key items."}
      </span>
      
      <div className="flex items-center gap-1.5">
        {onExtract && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-xs px-2"
            onClick={() => onExtract('task')}
          >
            <ListTodo className="w-3 h-3 mr-1" />
            Tasks
          </Button>
        )}
        {onExtract && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-xs px-2"
            onClick={() => onExtract('decision')}
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Decisions
          </Button>
        )}
        {onArchive && (
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-6 text-xs px-2"
            onClick={onArchive}
          >
            <Archive className="w-3 h-3 mr-1" />
            Archive
          </Button>
        )}
        {onNewConversation && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 text-xs px-2"
            onClick={onNewConversation}
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        )}
        {onDismiss && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0"
            onClick={onDismiss}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
