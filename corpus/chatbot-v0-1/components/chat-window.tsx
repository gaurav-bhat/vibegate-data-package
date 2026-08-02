"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { useEffect, useRef, useState } from "react"
import { ArrowUp, Bot, TriangleAlert, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ChatWindow() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  const isBusy = status === "submitted" || status === "streaming"

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    sendMessage({ text })
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Respect IME composition so CJK input isn't submitted mid-composition.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold leading-tight text-foreground">Assistant</h1>
          <p className="text-xs leading-tight text-muted-foreground">Powered by OpenAI</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
          {messages.length === 0 && (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bot className="size-6" aria-hidden="true" />
              </span>
              <p className="text-balance text-sm text-muted-foreground">
                Start the conversation by typing a message below.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user"
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isUser ? (
                    <User className="size-4" aria-hidden="true" />
                  ) : (
                    <Bot className="size-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">{isUser ? "You" : "Assistant"}</span>
                </span>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm bg-muted text-foreground"
                  }`}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? <span key={`${message.id}-${i}`}>{part.text}</span> : null,
                  )}
                </div>
              </div>
            )
          })}

          {status === "submitted" && (
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-4" aria-hidden="true" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="leading-relaxed">
                Something went wrong reaching the assistant. Check that a valid OpenAI API key is set, then try again.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message..."
            aria-label="Message"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isBusy || !input.trim()}
            className="size-11 shrink-0 rounded-full"
            aria-label="Send message"
          >
            <ArrowUp className="size-5" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  )
}
