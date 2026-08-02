import { useState, useRef, useEffect } from 'react';
import { useGetSession, useSendMessage, getGetSessionQueryKey, getListSessionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatPanelProps {
  sessionId: number | null;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: session, isLoading } = useGetSession(
    sessionId!, 
    { 
      query: { 
        enabled: !!sessionId,
        queryKey: getGetSessionQueryKey(sessionId!)
      } 
    }
  );
  
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSend = () => {
    if (!sessionId || !message.trim() || sendMessage.isPending) return;

    sendMessage.mutate(
      { id: sessionId, data: { content: message.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId) });
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          setMessage('');
          textareaRef.current?.focus();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!sessionId) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-2xl font-semibold mb-2">Welcome to your AI assistant</h2>
          <p className="text-muted-foreground">
            Start a new conversation or select an existing one from the sidebar
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold truncate" data-testid="session-title">
          {session?.title}
        </h1>
        {session && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 px-6">
        <div ref={scrollRef} className="py-6 space-y-6 max-w-3xl mx-auto">
          {session?.messages && session.messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Send a message to start the conversation</p>
            </div>
          ) : (
            session?.messages.map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  'animate-message-enter flex gap-4',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-5 py-3',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-card-border'
                  )}
                >
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.content}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-2 opacity-60',
                      msg.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {sendMessage.isPending && (
            <div className="flex gap-4 animate-message-enter" data-testid="message-loading">
              <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-card border border-card-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-current rounded-full animate-pulse-subtle" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 bg-current rounded-full animate-pulse-subtle" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-current rounded-full animate-pulse-subtle" style={{ animationDelay: '0.4s' }} />
                  </div>
                  AI is thinking
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift + Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={sendMessage.isPending}
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
            data-testid="button-send"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
