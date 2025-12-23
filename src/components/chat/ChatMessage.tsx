import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtractionMenu } from './ExtractionMenu';
import type { Message } from '@/hooks/useMessages';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  projectId?: string;
}

export function ChatMessage({ message, isStreaming, projectId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showExtraction = !isStreaming && projectId && message.id !== 'streaming';
  
  return (
    <div className={cn(
      "group flex gap-3 animate-in fade-in slide-in-from-bottom-2",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={cn(
        "flex-1 max-w-[80%] rounded-lg px-4 py-3 relative",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        <div className={cn(
          "text-sm whitespace-pre-wrap break-words",
          isStreaming && "after:content-['▋'] after:animate-pulse after:ml-0.5"
        )}>
          {message.content}
        </div>
        <div className={cn(
          "flex items-center justify-between mt-2",
          isUser ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          <span className="text-xs opacity-60">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {showExtraction && (
            <ExtractionMenu 
              content={message.content} 
              projectId={projectId}
              conversationId={message.conversation_id}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                isUser ? "text-primary-foreground hover:bg-primary-foreground/20" : ""
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
