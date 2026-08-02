import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, MessageSquare, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (typeof data.reply !== "string") {
        throw new Error("Unexpected response from server.");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setError(null);
    setInput("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 leading-tight">AI Chat</h1>
              <p className="text-xs text-slate-500">Powered by OpenAI</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              New chat
            </button>
          )}
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md mb-5">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-slate-500 max-w-md">
                  Ask me anything — I can help with writing, brainstorming, coding, and more.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Couldn't get a reply</p>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="w-full pl-4 pr-14 py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-slate-200"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        }`}
      >
        {isUser ? (
          <span className="text-xs font-semibold text-slate-600">You</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-slate-900 text-white rounded-tr-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export default App;
