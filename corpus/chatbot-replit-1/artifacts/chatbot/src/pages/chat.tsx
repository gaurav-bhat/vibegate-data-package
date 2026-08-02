import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useGetConversation,
  useListMessages,
  useSendMessage,
  getListMessagesQueryKey,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@workspace/api-client-react';

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const conversationId = params.id ? Number(params.id) : null;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const { data: conversation, isLoading: conversationLoading } = useGetConversation(
    conversationId!,
    {
      query: {
        enabled: !!conversationId,
        queryKey: getGetConversationQueryKey(conversationId!),
      },
    }
  );

  const { data: messages, isLoading: messagesLoading } = useListMessages(conversationId!, {
    query: {
      enabled: !!conversationId,
      queryKey: getListMessagesQueryKey(conversationId!),
    },
  });

  const sendMessage = useSendMessage();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || !conversationId || sendMessage.isPending) return;

    const content = input.trim();
    setInput('');

    sendMessage.mutate(
      { id: conversationId, data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(conversationId) });
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
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

  if (!conversationId) {
    setLocation('/');
    return null;
  }

  if (conversationLoading || messagesLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '400ms' }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif font-medium text-foreground mb-2">Conversation not found</h2>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to conversations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-serif font-medium text-foreground truncate">{conversation.title}</h1>
              <p className="text-xs text-muted-foreground">
                {conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-serif font-medium text-foreground mb-2">Start the conversation</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Type your first message below to begin exploring your thoughts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages?.map((message: Message, index: number) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    } rounded-2xl px-5 py-4`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start animate-message-in">
                  <div className="max-w-[85%] md:max-w-[75%] bg-card border border-border rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="min-h-[56px] max-h-[200px] resize-none bg-background"
              disabled={sendMessage.isPending}
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              size="icon"
              className="h-[56px] w-[56px] shrink-0"
              data-testid="button-send"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
