import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSendMessage, useGetConversationStarters, getGetConversationStartersQueryKey } from '@workspace/api-client-react';
import type { ChatMessage } from '@workspace/api-client-react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: starters, isLoading: startersLoading } = useGetConversationStarters({
    query: {
       queryKey: getGetConversationStartersQueryKey()
    }
  });

  const sendMessageMutation = useSendMessage();

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, sendMessageMutation.isPending]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSend = (text: string) => {
    if (!text.trim() || sendMessageMutation.isPending) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text.trim() }
    ];

    setMessages(newMessages);
    setInput('');

    sendMessageMutation.mutate(
      { data: { messages: newMessages } },
      {
        onSuccess: (reply) => {
          setMessages((prev) => [...prev, reply]);
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="shrink-0 h-16 flex items-center px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/40">
        <div className="flex items-center gap-2 text-primary cursor-default max-w-3xl mx-auto w-full">
          <Sparkles className="w-5 h-5" />
          <span className="font-serif text-lg font-medium tracking-wide">ThinkSpace</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-36">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-3 text-center tracking-tight">
                What's on your mind?
              </h1>
              <p className="text-muted-foreground text-center mb-10 max-w-md text-lg leading-relaxed">
                A clear, quiet place to think through ideas, untangle problems, or just reflect.
              </p>

              <div className="w-full flex flex-col gap-3">
                {!startersLoading && starters?.map((starter, i) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                    key={i}
                    onClick={() => handleSend(starter.text)}
                    className="text-left w-full p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/40 active:scale-[0.99] transition-all group"
                  >
                    <span className="text-foreground/90 group-hover:text-primary transition-colors text-base font-medium">
                      {starter.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pt-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm shadow-sm'
                          : 'bg-card border border-border text-foreground shadow-sm rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px] md:text-[16px]">
                        {msg.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {sendMessageMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] md:max-w-[75%] p-5 rounded-3xl bg-card border border-border shadow-sm rounded-bl-sm flex items-center gap-2 h-[60px]">
                    <div className="flex gap-1.5 items-center px-2">
                      <motion.div className="w-2 h-2 rounded-full bg-primary/40" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-2 h-2 rounded-full bg-primary/40" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                      <motion.div className="w-2 h-2 rounded-full bg-primary/40" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                    </div>
                  </div>
                </motion.div>
              )}
              {sendMessageMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center my-2"
                >
                  <div className="px-4 py-3 rounded-full bg-destructive/10 text-destructive text-sm flex items-center gap-2 shadow-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed to send message. Please try again.</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 pointer-events-none z-10">
        <div className="max-w-3xl mx-auto pointer-events-auto relative shadow-2xl shadow-black/5 rounded-[2rem]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-end gap-2 bg-card p-2.5 rounded-[2rem] border border-border/60 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you thinking?"
              className="min-h-[44px] max-h-[200px] resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent px-4 py-3 text-base leading-relaxed"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full h-12 w-12 hover:scale-105 active:scale-95 transition-all shadow-sm"
              disabled={!input.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-5 h-5 ml-[2px]" />
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}