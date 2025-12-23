import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, Bug, Map, Code, Eye, FileText, CheckSquare, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMessages, useCreateMessage, useUpdateConversationMode, type Message } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useDecisions } from '@/hooks/useDecisions';
import { useDocuments } from '@/hooks/useDocuments';
import { useConversation } from '@/hooks/useConversations';
import { ChatMessage } from './ChatMessage';
import { ModeSelector } from './ModeSelector';
import { ContextPanel } from './ContextPanel';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];

interface ChatInterfaceProps {
  conversationId: string;
  projectId: string;
  onClose?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatInterface({ conversationId, projectId, onClose }: ChatInterfaceProps) {
  const { data: messages = [], isLoading: messagesLoading } = useMessages(conversationId);
  const { data: conversation } = useConversation(conversationId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: decisions = [] } = useDecisions(projectId);
  const { data: documents = [] } = useDocuments(projectId);
  
  const createMessage = useCreateMessage();
  const updateMode = useUpdateConversationMode();
  
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{
    tasks: string[];
    decisions: string[];
    documents: string[];
  }>({ tasks: [], decisions: [], documents: [] });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const currentMode = (conversation?.mode || 'design') as AIMode;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

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
    if (!input.trim() || isStreaming) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    
    // Save user message
    await createMessage.mutateAsync({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });
    
    // Build messages for API
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
          <span className="text-sm text-muted-foreground">{conversation?.title}</span>
        </div>
        <div className="flex items-center gap-2">
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
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
          </ScrollArea>
          
          {/* Input */}
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
        </div>
        
        {/* Context Panel */}
        {showContext && (
          <ContextPanel
            tasks={tasks}
            decisions={decisions}
            documents={documents}
            selectedContext={selectedContext}
            onContextChange={setSelectedContext}
            onClose={() => setShowContext(false)}
          />
        )}
      </div>
    </div>
  );
}
