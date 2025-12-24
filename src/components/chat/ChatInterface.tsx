import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Send, Loader2, Sparkles, FileText, X, Archive, MessageSquare, ChevronUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useFlattenedMessages, useCreateMessage, useUpdateConversationMode, MESSAGE_PAGE_SIZE, type Message } from '@/hooks/useMessages';
import { useTasks, useCreateTask } from '@/hooks/useTasks';
import { useDecisions, useCreateDecision } from '@/hooks/useDecisions';
import { useDocuments, useCreateDocument } from '@/hooks/useDocuments';
import { useConversation, useArchiveConversation, useUnarchiveConversation, useCreateConversation } from '@/hooks/useConversations';
import { useAIContext, getDefaultIncludeMessages, MAX_RECENT_MESSAGES } from '@/hooks/useAIContext';
import { ChatMessage } from './ChatMessage';
import { ModeSelector } from './ModeSelector';
import { ContextPanel } from './ContextPanel';
import { ConversationHealth, ConversationHealthBanner, type ExtractionType } from '@/components/conversations/ConversationHealth';
import { SummarizeArchiveModal } from '@/components/conversations/SummarizeArchiveModal';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

const EXTRACT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract`;

type AIMode = Database['public']['Enums']['ai_mode'];

interface ChatInterfaceProps {
  conversationId: string;
  projectId: string;
  onClose?: () => void;
  isArchived?: boolean;
  shouldLoadMessages?: boolean;
  onRequestLoadMessages?: () => void;
  onNavigateToConversation?: (conversationId: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatInterface({ 
  conversationId, 
  projectId, 
  onClose,
  isArchived = false,
  shouldLoadMessages = true,
  onRequestLoadMessages,
  onNavigateToConversation,
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const { 
    messages, 
    isLoading: messagesLoading, 
    isFetchingNextPage,
    hasOlderMessages,
    fetchOlderMessages,
  } = useFlattenedMessages(conversationId, shouldLoadMessages);
  
  const { data: conversation } = useConversation(conversationId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: decisions = [] } = useDecisions(projectId);
  const { data: documents = [] } = useDocuments(projectId);
  
  const createMessage = useCreateMessage();
  const updateMode = useUpdateConversationMode();
  const archiveConversation = useArchiveConversation();
  const unarchiveConversation = useUnarchiveConversation();
  const createConversation = useCreateConversation();
  const createTask = useCreateTask();
  const createDecision = useCreateDecision();
  const createDocument = useCreateDocument();
  
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    tasks: string[];
    decisions: string[];
    documents: string[];
  }>({ tasks: [], decisions: [], documents: [] });
  
  // Include recent messages toggle - default based on whether summary exists
  const [includeRecentMessages, setIncludeRecentMessages] = useState(() => 
    getDefaultIncludeMessages(conversation)
  );
  
  // Update toggle default when conversation loads
  useEffect(() => {
    if (conversation) {
      setIncludeRecentMessages(getDefaultIncludeMessages(conversation));
    }
  }, [conversation?.id, conversation?.summary]);
  
  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  
  // Health banner dismiss state
  const [healthBannerDismissed, setHealthBannerDismissed] = useState(false);
  
  // Extraction loading state
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Scroll management
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [scrollHeightBefore, setScrollHeightBefore] = useState(0);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  
  const currentMode = (conversation?.mode || 'design') as AIMode;
  const hasSummary = !!conversation?.summary;

  // Build structured AI context
  const aiContext = useAIContext({
    conversation: conversation || null,
    tasks,
    decisions,
    documents,
    messages,
    includeRecentMessages,
  });

  // Scroll to bottom for new messages (only if user was at bottom)
  useEffect(() => {
    if (shouldScrollToBottom && scrollContainerRef.current && !isLoadingOlder) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages.length, streamingContent, shouldScrollToBottom, isLoadingOlder]);

  // Preserve scroll position when prepending older messages
  useLayoutEffect(() => {
    if (isLoadingOlder && scrollContainerRef.current && scrollHeightBefore > 0) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - scrollHeightBefore;
      scrollContainerRef.current.scrollTop = scrollDiff;
      setIsLoadingOlder(false);
      setScrollHeightBefore(0);
    }
  }, [messages, isLoadingOlder, scrollHeightBefore]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Track scroll position to determine if we should auto-scroll
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScrollToBottom(isAtBottom);
    }
  }, []);

  const handleLoadOlderMessages = useCallback(async () => {
    if (scrollContainerRef.current) {
      setScrollHeightBefore(scrollContainerRef.current.scrollHeight);
      setIsLoadingOlder(true);
    }
    await fetchOlderMessages();
  }, [fetchOlderMessages]);

  const handleModeChange = async (mode: AIMode) => {
    await updateMode.mutateAsync({ id: conversationId, mode });
  };

  // Health action handlers - direct extraction without intermediate state
  const handleExtract = useCallback(async (type: ExtractionType) => {
    // Find the most recent assistant message for extraction
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMessage) {
      toast({
        title: 'No messages to extract from',
        description: 'Send some messages first to extract tasks or decisions.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);

    try {
      const response = await fetch(EXTRACT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ content: lastAssistantMessage.content, extractionType: type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Extraction failed');
      }

      const result = await response.json();
      const data = result.data;

      if (type === 'task') {
        await createTask.mutateAsync({
          project_id: projectId,
          conversation_id: conversationId,
          title: data.title,
          description: data.description,
          next_action: data.next_action,
          priority: data.priority,
        });
        toast({ title: 'Task created', description: data.title });
      } else if (type === 'decision') {
        await createDecision.mutateAsync({
          project_id: projectId,
          conversation_id: conversationId,
          title: data.title,
          decision: data.decision,
          rationale: data.rationale,
          impact: data.impact,
        });
        toast({ title: 'Decision created', description: data.title });
      } else if (type === 'document') {
        await createDocument.mutateAsync({
          project_id: projectId,
          title: data.title,
          content: data.content,
          is_pinned: data.is_pinned || false,
        });
        toast({ title: 'Document created', description: data.title });
      } else if (type === 'auto') {
        const { tasks: extractedTasks = [], decisions: extractedDecisions = [], documents: extractedDocs = [] } = data;
        let created = { tasks: 0, decisions: 0, documents: 0 };
        
        for (const task of extractedTasks) {
          await createTask.mutateAsync({
            project_id: projectId,
            conversation_id: conversationId,
            title: task.title,
            description: task.description,
            next_action: task.next_action,
            priority: task.priority,
          });
          created.tasks++;
        }
        
        for (const decision of extractedDecisions) {
          await createDecision.mutateAsync({
            project_id: projectId,
            conversation_id: conversationId,
            title: decision.title,
            decision: decision.decision,
            rationale: decision.rationale,
            impact: decision.impact,
          });
          created.decisions++;
        }
        
        for (const doc of extractedDocs) {
          await createDocument.mutateAsync({
            project_id: projectId,
            title: doc.title,
            content: doc.content,
            is_pinned: doc.is_pinned || false,
          });
          created.documents++;
        }
        
        const parts = [];
        if (created.tasks > 0) parts.push(`${created.tasks} task${created.tasks > 1 ? 's' : ''}`);
        if (created.decisions > 0) parts.push(`${created.decisions} decision${created.decisions > 1 ? 's' : ''}`);
        if (created.documents > 0) parts.push(`${created.documents} document${created.documents > 1 ? 's' : ''}`);
        
        if (parts.length > 0) {
          toast({ title: 'Extracted', description: `Created ${parts.join(', ')}` });
        } else {
          toast({ title: 'No items found', description: 'No actionable items were found.' });
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  }, [messages, toast, createTask, createDecision, createDocument, projectId, conversationId]);

  const handleNewConversation = useCallback(async () => {
    try {
      const newConv = await createConversation.mutateAsync({
        project_id: projectId,
        title: `Follow-up: ${conversation?.title || 'New Conversation'}`,
        purpose: conversation?.purpose || undefined,
        mode: currentMode,
      });
      
      toast({
        title: 'New conversation started',
        description: 'Continuing from where you left off.',
      });
      
      if (onNavigateToConversation) {
        onNavigateToConversation(newConv.id);
      }
    } catch (error) {
      toast({
        title: 'Failed to create conversation',
        variant: 'destructive',
      });
    }
  }, [createConversation, projectId, conversation, currentMode, toast, onNavigateToConversation]);

  const handleGenerateSummary = useCallback(() => {
    // Open archive modal which has the summary textarea
    // User can generate or write summary there
    setArchiveModalOpen(true);
    toast({
      title: 'Add a summary',
      description: 'Write a summary to archive this conversation.',
    });
  }, [toast]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isArchived) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setShouldScrollToBottom(true);
    
    // Save user message
    await createMessage.mutateAsync({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });
    
    try {
      // Send structured context to edge function - NO full history
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userMessage,
          context: aiContext,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }
      
      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let textBuffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamingContent(fullContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      
      // Save assistant message
      if (fullContent) {
        await createMessage.mutateAsync({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullContent,
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setStreamingContent('');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contextCount = selectedContext.tasks.length + selectedContext.decisions.length + selectedContext.documents.length;
  const messageCount = messages.length + (streamingContent ? 1 : 0);

  const handleArchiveConfirm = async (summary: string, purpose?: string) => {
    await archiveConversation.mutateAsync({ id: conversationId, summary, purpose });
    setArchiveModalOpen(false);
    onClose?.();
  };

  const handleUnarchive = async () => {
    await unarchiveConversation.mutateAsync({ id: conversationId });
  };

  // Archived conversation summary view (before loading messages)
  const renderArchivedSummaryView = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
        <Archive className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">{conversation?.title}</h3>
      
      {conversation?.purpose && (
        <p className="text-muted-foreground mb-4 max-w-md">{conversation.purpose}</p>
      )}
      
      {conversation?.summary && (
        <div className="w-full max-w-lg p-4 bg-secondary/40 rounded-lg border border-border/50 mb-6 text-left">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Summary</p>
          <p className="text-sm text-foreground leading-relaxed">{conversation.summary}</p>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <Button 
          variant="default" 
          onClick={onRequestLoadMessages}
          className="gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Load Messages
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleUnarchive}
          disabled={unarchiveConversation.isPending}
        >
          Unarchive
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {!isArchived && (
            <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
          )}
          <span className="text-sm text-muted-foreground">{conversation?.title}</span>
          {isArchived && (
            <Badge variant="secondary" className="gap-1">
              <Archive className="w-3 h-3" />
              Archived
            </Badge>
          )}
          {!isArchived && (
            <ConversationHealth 
              messageCount={messageCount} 
              hasSummary={hasSummary}
              onArchive={() => setArchiveModalOpen(true)}
              onExtract={handleExtract}
              onNewConversation={onNavigateToConversation ? handleNewConversation : undefined}
              onGenerateSummary={handleGenerateSummary}
              compact 
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Recent Messages Toggle */}
          {!isArchived && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50">
                    <History className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      includeRecentMessages ? "text-primary" : "text-muted-foreground"
                    )} />
                    <Label htmlFor="include-messages" className="text-xs text-muted-foreground cursor-pointer">
                      Last {MAX_RECENT_MESSAGES}
                    </Label>
                    <Switch
                      id="include-messages"
                      checked={includeRecentMessages}
                      onCheckedChange={setIncludeRecentMessages}
                      className="scale-75"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    {includeRecentMessages 
                      ? `Include last ${MAX_RECENT_MESSAGES} messages in AI context` 
                      : conversation?.summary 
                        ? "Using conversation summary instead of message history"
                        : "Enable to include recent messages in AI context"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {!isArchived && (
            <Button
              variant={showContext ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowContext(!showContext)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Context
              {contextCount > 0 && (
                <Badge variant="secondary" className="ml-1">{contextCount}</Badge>
              )}
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Health Banner - shows for orange/red states */}
      {!isArchived && !healthBannerDismissed && (
        <ConversationHealthBanner
          messageCount={messageCount}
          hasSummary={hasSummary}
          onArchive={() => setArchiveModalOpen(true)}
          onExtract={handleExtract}
          onNewConversation={onNavigateToConversation ? handleNewConversation : undefined}
          onDismiss={() => setHealthBannerDismissed(true)}
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Show summary view for archived conversations that haven't loaded messages */}
        {isArchived && !shouldLoadMessages ? (
          renderArchivedSummaryView()
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 flex flex-col min-w-0">
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4"
                onScroll={handleScroll}
              >
                {/* Load older messages button */}
                {hasOlderMessages && !messagesLoading && (
                  <div className="flex justify-center mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadOlderMessages}
                      disabled={isFetchingNextPage}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                      Load older messages
                    </Button>
                  </div>
                )}

                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 && !streamingContent ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Start the conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Ask questions, get help with your project, or explore ideas. 
                      The AI uses structured memory from your project context.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} projectId={projectId} />
                    ))}
                    {streamingContent && (
                      <ChatMessage 
                        message={{ 
                          id: 'streaming', 
                          conversation_id: conversationId,
                          role: 'assistant', 
                          content: streamingContent,
                          created_at: new Date().toISOString(),
                        }} 
                        isStreaming 
                      />
                    )}
                  </div>
                )}
              </div>
              
              {/* Input - disabled for archived conversations */}
              {!isArchived && (
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex gap-2">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="min-h-[44px] max-h-[200px] resize-none"
                      disabled={isStreaming}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={!input.trim() || isStreaming}
                      className="shrink-0"
                    >
                      {isStreaming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Context Panel */}
            {showContext && !isArchived && (
              <ContextPanel
                tasks={tasks}
                decisions={decisions}
                documents={documents}
                selectedContext={selectedContext}
                onContextChange={setSelectedContext}
                onClose={() => setShowContext(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Summarize & Archive Modal */}
      <SummarizeArchiveModal
        open={archiveModalOpen}
        onOpenChange={setArchiveModalOpen}
        conversationTitle={conversation?.title || ''}
        currentPurpose={conversation?.purpose}
        onConfirm={handleArchiveConfirm}
        isPending={archiveConversation.isPending}
      />
    </div>
  );
}
