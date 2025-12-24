import { useState } from 'react';
import { MessageSquare, Archive, Clock, ChevronDown, Sparkles, Bug, Map, Code, Eye, Plus, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useConversations, useCreateConversation, useArchiveConversation, useUnarchiveConversation, type Conversation } from '@/hooks/useConversations';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ConversationHealth } from './ConversationHealth';
import { SummarizeArchiveModal } from './SummarizeArchiveModal';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];

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

interface ConversationsListProps {
  projectId: string;
}

export function ConversationsList({ projectId }: ConversationsListProps) {
  const { data: conversations, isLoading } = useConversations(projectId);
  const createConversation = useCreateConversation();
  const archiveConversation = useArchiveConversation();
  const unarchiveConversation = useUnarchiveConversation();
  
  const [showArchived, setShowArchived] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newMode, setNewMode] = useState<AIMode>('design');
  
  // State for archive modal
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [conversationToArchive, setConversationToArchive] = useState<Conversation | null>(null);
  
  // State for archived conversation message loading
  const [loadMessagesForId, setLoadMessagesForId] = useState<string | null>(null);
  
  const activeConversations = conversations?.filter(c => !c.is_archived) || [];
  const archivedConversations = conversations?.filter(c => c.is_archived) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCreateConversation = async () => {
    if (!newTitle.trim()) return;
    
    const result = await createConversation.mutateAsync({
      project_id: projectId,
      title: newTitle,
      purpose: newPurpose || undefined,
      mode: newMode,
    });
    
    setShowNewDialog(false);
    setNewTitle('');
    setNewPurpose('');
    setNewMode('design');
    setActiveConversationId(result.id);
  };

  const handleOpenArchiveModal = (conversation: Conversation) => {
    setConversationToArchive(conversation);
    setArchiveModalOpen(true);
  };

  const handleArchiveConfirm = async (summary: string, purpose?: string) => {
    if (!conversationToArchive) return;
    
    await archiveConversation.mutateAsync({ 
      id: conversationToArchive.id, 
      summary,
      purpose,
    });
    
    setArchiveModalOpen(false);
    setConversationToArchive(null);
  };

  const handleUnarchive = async (id: string) => {
    await unarchiveConversation.mutateAsync({ id });
  };

  const handleLoadMessages = (conversationId: string) => {
    setLoadMessagesForId(conversationId);
    setActiveConversationId(conversationId);
  };

  const ConversationCard = ({ conversation, isArchived = false }: { conversation: Conversation; isArchived?: boolean }) => {
    const ModeIcon = modeIcons[conversation.mode];
    
    return (
      <Card 
        variant="interactive"
        className={cn(
          "transition-all duration-200",
          isArchived && "opacity-80"
        )}
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
              
              {conversation.purpose && (
                <p className="text-sm text-muted-foreground line-clamp-1">{conversation.purpose}</p>
              )}
              
              {/* Summary-first display for archived conversations */}
              {isArchived && conversation.summary && (
                <div className="mt-2 p-3 bg-secondary/40 rounded-lg border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
                  <p className="text-sm text-foreground">{conversation.summary}</p>
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {conversation.mode}
                </Badge>
                {!isArchived && (
                  <ConversationHealth 
                    messageCount={conversation.message_count || 0} 
                    onArchive={() => handleOpenArchiveModal(conversation)}
                    compact 
                  />
                )}
                {isArchived && conversation.message_count && (
                  <span className="text-xs text-muted-foreground">
                    {conversation.message_count} messages
                  </span>
                )}
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => handleLoadMessages(conversation.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Load Messages
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleUnarchive(conversation.id)}
                  disabled={unarchiveConversation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Unarchive
                </Button>
              </>
            ) : (
              <>
                <Button variant="default" size="sm" className="flex-1" onClick={() => setActiveConversationId(conversation.id)}>
                  Continue
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenArchiveModal(conversation);
                  }}
                >
                  <Archive className="w-4 h-4" />
                  Summarize & Archive
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show chat interface if conversation is active
  if (activeConversationId) {
    const activeConv = conversations?.find(c => c.id === activeConversationId);
    const isArchivedConversation = activeConv?.is_archived ?? false;
    const shouldLoadMessages = !isArchivedConversation || loadMessagesForId === activeConversationId;
    
    return (
      <div className="h-[calc(100vh-4rem)]">
        <ChatInterface 
          conversationId={activeConversationId} 
          projectId={projectId} 
          onClose={() => {
            setActiveConversationId(null);
            setLoadMessagesForId(null);
          }}
          isArchived={isArchivedConversation}
          shouldLoadMessages={shouldLoadMessages}
          onRequestLoadMessages={() => setLoadMessagesForId(activeConversationId)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Active Conversations</h3>
          <p className="text-sm text-muted-foreground">{activeConversations.length} active, {archivedConversations.length} archived</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button variant="glow" className="gap-2">
              <Plus className="w-4 h-4" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Architecture Planning Session"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose (optional)</Label>
                <Input
                  id="purpose"
                  placeholder="Define system architecture"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">AI Mode</Label>
                <Select value={newMode} onValueChange={(v) => setNewMode(v as AIMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="glow"
                className="w-full"
                onClick={handleCreateConversation}
                disabled={!newTitle.trim() || createConversation.isPending}
              >
                {createConversation.isPending ? 'Creating...' : 'Start Conversation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Active Conversations */}
      {activeConversations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {activeConversations.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-8">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No active conversations</h4>
          <p className="text-muted-foreground mb-4">Start a new conversation to begin working with AI.</p>
          <Button variant="glow" onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Start First Conversation
          </Button>
        </div>
      )}

      {/* Archived Conversations */}
      {archivedConversations.length > 0 && (
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
      )}

      {/* Summarize & Archive Modal */}
      <SummarizeArchiveModal
        open={archiveModalOpen}
        onOpenChange={setArchiveModalOpen}
        conversationTitle={conversationToArchive?.title || ''}
        currentPurpose={conversationToArchive?.purpose}
        onConfirm={handleArchiveConfirm}
        isPending={archiveConversation.isPending}
      />
    </div>
  );
}
