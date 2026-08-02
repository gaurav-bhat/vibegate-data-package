import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendChat, type ChatMessage } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Chatbot" },
      { name: "description", content: "Chat with an AI assistant powered by OpenAI." },
      { property: "og:title", content: "AI Chatbot" },
      { property: "og:description", content: "Chat with an AI assistant powered by OpenAI." },
    ],
  }),
  component: Index,
});

function Index() {
  const send = useServerFn(sendChat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const { reply } = await send({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">AI Chatbot</h1>
        <p className="text-sm text-muted-foreground">Powered by OpenAI</p>
      </header>

      <div ref={scrollRef} className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="m-auto text-center text-sm text-muted-foreground">
            Start the conversation by sending a message.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                : "mr-auto max-w-[80%] text-foreground"
            }
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="mr-auto text-sm text-muted-foreground">Thinking…</div>
        )}
        {error && (
          <div className="mr-auto rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-border bg-background px-4 py-4">
        <div className="mx-auto flex w-full max-w-2xl gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={loading}
            aria-label="Message"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </main>
  );
}
