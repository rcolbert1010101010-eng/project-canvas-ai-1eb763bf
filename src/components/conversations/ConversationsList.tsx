import { useState } from 'react';
import { MessageSquare, Archive, Clock, ChevronDown, Sparkles, Bug, Map, Code, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Conversation, AIMode } from '@/types';

const mockConversations: Conversation[] = [
  { id: '1', project_id: '1', title: 'Architecture Planning Session', purpose: 'Define system architecture and core patterns', summary: null, is_archived: false, mode: 'design', created_at: '2024-01-15T10:30:00', message_count: 24 },
  { id: '2', project_id: '1', title: 'Debugging Auth Flow', purpose: 'Fix OAuth callback issues', summary: null, is_archived: false, mode: 'debug', created_at: '2024-01-14T14:20:00', message_count: 18 },
  { id: '3', project_id: '1', title: 'Sprint Planning Q1', purpose: 'Plan features for Q1 2024', summary: null, is_archived: false, mode: 'planning', created_at: '2024-01-13T09:00:00', message_count: 32 },
  { id: '4', project_id: '1', title: 'API Design Review', purpose: 'Review REST endpoints design', summary: 'Reviewed all API endpoints. Decided on REST over GraphQL. Need to add rate limiting.', is_archived: true, mode: 'review', created_at: '2024-01-10T11:00:00', message_count: 45 },
  { id: '5', project_id: '1', title: 'Database Migration Strategy', purpose: 'Plan data migration from legacy system', summary: 'Established 3-phase migration approach with rollback capabilities.', is_archived: true, mode: 'implementation', created_at: '2024-01-08T15:30:00', message_count: 28 },
];

const modeIcons: Record<AIMode, React.ComponentType<{ className?: string }>> = {
  design: Sparkles,
  debug: Bug,
  planning: Map,
  implementation: Code,
  review: Eye,
};

const modeColors: Record<AIMode, string> = {
  design: 'bg-primary/10 text-primary',
  debug: 'bg-destructive/10 text-destructive',
  planning: 'bg-warning/10 text-warning',
  implementation: 'bg-info/10 text-info',
  review: 'bg-success/10 text-success',
};

export function ConversationsList() {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const activeConversations = mockConversations.filter(c => !c.is_archived);
  const archivedConversations = mockConversations.filter(c => c.is_archived);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ConversationCard = ({ conversation, isArchived = false }: { conversation: Conversation; isArchived?: boolean }) => {
    const ModeIcon = modeIcons[conversation.mode];
    
    return (
      <Card 
        variant="interactive"
        className={cn(
          "transition-all duration-200",
          selectedConversation === conversation.id && "ring-2 ring-primary/50",
          isArchived && "opacity-70"
        )}
        onClick={() => setSelectedConversation(conversation.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              modeColors[conversation.mode]
            )}>
              <ModeIcon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate">{conversation.title}</h4>
                {isArchived && (
                  <Archive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-1">{conversation.purpose}</p>
              
              {isArchived && conversation.summary && (
                <p className="text-sm text-muted-foreground/80 mt-2 p-2 bg-secondary/30 rounded-md line-clamp-2">
                  {conversation.summary}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {conversation.mode}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {conversation.message_count}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(conversation.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            {isArchived ? (
              <>
                <Button variant="ghost" size="sm" className="flex-1">Load Messages</Button>
                <Button variant="ghost" size="sm" className="flex-1">Unarchive</Button>
              </>
            ) : (
              <>
                <Button variant="default" size="sm" className="flex-1">Continue</Button>
                <Button variant="ghost" size="sm" className="flex-1">Archive</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 animate-in">
      {/* Active Conversations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Active Conversations</h3>
          <Badge variant="info">{activeConversations.length} active</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeConversations.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} />
          ))}
        </div>
      </div>

      {/* Archived Conversations */}
      <div>
        <button 
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            showArchived && "rotate-180"
          )} />
          <span className="text-sm font-medium">Archived Conversations</span>
          <Badge variant="secondary">{archivedConversations.length}</Badge>
        </button>
        
        {showArchived && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
            {archivedConversations.map((conv) => (
              <ConversationCard key={conv.id} conversation={conv} isArchived />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
