"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef, useState } from "react"
import { ArrowUp, Bot, Loader2, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function Chat() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const isBusy = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, status])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-foreground">
            AI Chat
          </h1>
          <p className="text-xs leading-tight text-muted-foreground">
            Powered by OpenAI
          </p>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        aria-live="polite"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          {messages.length === 0 && (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="size-6" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-foreground text-balance">
                How can I help you today?
              </p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Ask me anything to start the conversation.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user"
            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  isUser && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    isUser
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                  aria-hidden="true"
                >
                  {isUser ? (
                    <User className="size-4" />
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-muted text-foreground",
                  )}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{part.text}</span>
                    ) : null,
                  )}
                </div>
              </div>
            )
          })}

          {status === "submitted" && (
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Thinking...
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              Something went wrong. Please try again.
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  handleSubmit(e)
                }
              }}
              rows={1}
              placeholder="Type your message..."
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim() || isBusy}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUp className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
