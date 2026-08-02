import { useState } from 'react';
import { useListSessions, useCreateSession, useDeleteSession, getListSessionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ChatSidebarProps {
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
}

export function ChatSidebar({ activeSessionId, onSelectSession }: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading } = useListSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleNewChat = () => {
    createSession.mutate(
      { data: { title: 'New Conversation' } },
      {
        onSuccess: (newSession) => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          onSelectSession(newSession.id);
        },
      }
    );
  };

  const handleDeleteSession = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    deleteSession.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          if (activeSessionId === id) {
            onSelectSession(sessions[0]?.id || null);
          }
          setDeletingId(null);
        },
        onError: () => {
          setDeletingId(null);
        },
      }
    );
  };

  return (
    <div className="w-72 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={handleNewChat}
          disabled={createSession.isPending}
          className="w-full justify-start gap-2"
          data-testid="button-new-chat"
        >
          {createSession.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-sidebar-accent rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No conversations yet
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all group relative',
                  'hover:bg-sidebar-accent',
                  activeSessionId === session.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground'
                )}
                data-testid={`session-${session.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate mb-1">
                      {session.title}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{session.messageCount} messages</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    disabled={deletingId === session.id}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'p-1.5 rounded hover:bg-destructive/10 hover:text-destructive',
                      deletingId === session.id && 'opacity-100'
                    )}
                    data-testid={`button-delete-session-${session.id}`}
                  >
                    {deletingId === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
