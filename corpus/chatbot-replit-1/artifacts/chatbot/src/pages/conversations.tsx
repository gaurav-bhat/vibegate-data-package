import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { MessageSquarePlus, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useListConversations,
  useCreateConversation,
  useDeleteConversation,
  getListConversationsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ConversationsPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreateConversation = () => {
    createConversation.mutate(
      { data: { title: 'New Conversation' } },
      {
        onSuccess: (conversation) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setLocation(`/conversations/${conversation.id}`);
        },
      }
    );
  };

  const handleDeleteConversation = (id: number) => {
    deleteConversation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setDeleteId(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '400ms' }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  const sortedConversations = conversations
    ? [...conversations].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-medium text-foreground">Conversations</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {conversations?.length === 0 ? 'Start your first conversation' : `${conversations?.length} conversation${conversations?.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Button
              onClick={handleCreateConversation}
              disabled={createConversation.isPending}
              className="gap-2"
              data-testid="button-new-conversation"
            >
              <MessageSquarePlus className="w-4 h-4" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-medium text-foreground mb-2">No conversations yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Start a new conversation to begin exploring ideas with your AI thinking partner.
            </p>
            <Button onClick={handleCreateConversation} disabled={createConversation.isPending} className="gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              Start your first conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedConversations.map((conversation, index) => (
              <div
                key={conversation.id}
                className="group relative animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                data-testid={`card-conversation-${conversation.id}`}
              >
                <Link href={`/conversations/${conversation.id}`}>
                  <div className="block p-5 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-foreground mb-1 truncate">{conversation.title}</h3>
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {conversation.lastMessage}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span>{conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(conversation.id);
                        }}
                        data-testid={`button-delete-${conversation.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteConversation(deleteId)}
              disabled={deleteConversation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteConversation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
