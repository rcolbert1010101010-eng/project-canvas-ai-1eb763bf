import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Send, Loader2, Sparkles, Bug, Map, Code, Eye, FileText, CheckSquare, Lightbulb, X, Archive, MessageSquare, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFlattenedMessages, useCreateMessage, useUpdateConversationMode, MESSAGE_PAGE_SIZE, type Message } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useDecisions } from '@/hooks/useDecisions';
import { useDocuments } from '@/hooks/useDocuments';
import { useConversation, useArchiveConversation, useUnarchiveConversation } from '@/hooks/useConversations';
import { ChatMessage } from './ChatMessage';
import { ModeSelector } from './ModeSelector';
import { ContextPanel } from './ContextPanel';
import { ConversationHealth } from '@/components/conversations/ConversationHealth';
import { SummarizeArchiveModal } from '@/components/conversations/SummarizeArchiveModal';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];

interface ChatInterfaceProps {
  conversationId: string;
  projectId: string;
  onClose?: () => void;
  isArchived?: boolean;
  shouldLoadMessages?: boolean;
  onRequestLoadMessages?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatInterface({ 
  conversationId, 
  projectId, 
  onClose,
  isArchived = false,
  shouldLoadMessages = true,
  onRequestLoadMessages,
}: ChatInterfaceProps) {
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
  
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    tasks: string[];
    decisions: string[];
    documents: string[];
  }>({ tasks: [], decisions: [], documents: [] });
  
  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  
  // Scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [scrollHeightBefore, setScrollHeightBefore] = useState(0);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  
  const currentMode = (conversation?.mode || 'design') as AIMode;

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

  const buildContext = useCallback(() => {
    const contextTasks = tasks
      .filter(t => selectedContext.tasks.includes(t.id))
      .map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        description: t.description || undefined,
      }));
    
    const contextDecisions = decisions
      .filter(d => selectedContext.decisions.includes(d.id))
      .map(d => ({
        title: d.title,
        decision: d.decision,
        status: d.status,
        impact: d.impact,
      }));
    
    const contextDocuments = documents
      .filter(d => selectedContext.documents.includes(d.id))
      .map(d => ({
        title: d.title,
        content: d.content,
      }));
    
    return {
      tasks: contextTasks,
      decisions: contextDecisions,
      documents: contextDocuments,
    };
  }, [tasks, decisions, documents, selectedContext]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isArchived) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setShouldScrollToBottom(true); // Scroll to bottom for new messages
    
    // Save user message
    await createMessage.mutateAsync({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });
    
    // Build messages for API - send only loaded messages for context
    const apiMessages = [
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];
    
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: currentMode,
          context: buildContext(),
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
              onArchive={() => setArchiveModalOpen(true)}
              compact 
            />
          )}
        </div>
        <div className="flex items-center gap-2">
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
                      Add context from tasks, decisions, or documents for more relevant responses.
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
