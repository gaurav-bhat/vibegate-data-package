import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, AlertCircle } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT: Message = {
  role: 'assistant',
  content: "Hi! I'm your AI assistant. Ask me anything to get started.",
};

function App() {
  const [messages, setMessages] = useState<Message[]>([SYSTEM_PROMPT]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (typeof data.reply !== 'string') {
        throw new Error('Unexpected response from server.');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 leading-tight">AI Chatbot</h1>
            <p className="text-xs text-slate-500">Powered by OpenAI</p>
          </div>
        </div>
      </header>

      {/* Chat window */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm border border-slate-200 px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none max-h-32"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="m-1.5 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Press Enter to send, Shift+Enter for a new line
          </p>
        </div>
      </footer>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-slate-700'
            : 'bg-gradient-to-br from-blue-500 to-cyan-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-slate-800 text-white rounded-2xl rounded-tr-sm'
            : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

export default App;
