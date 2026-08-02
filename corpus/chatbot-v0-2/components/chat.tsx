"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef, useState } from "react"
import { ArrowUp, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Chat() {
  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })
  const [input, setInput] = useState("")
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
    // Respect IME composition (CJK input) before submitting on Enter.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          {messages.length === 0 && (
            <div className="mt-20 flex flex-col items-center gap-2 text-center">
              <h2 className="text-xl font-semibold text-foreground">How can I help you today?</h2>
              <p className="text-pretty text-sm text-muted-foreground">
                Send a message below to start chatting with the assistant.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user"
            return (
              <div key={message.id} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                        {part.text}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
            )
          })}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                Something went wrong. Please try again.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message the assistant..."
            aria-label="Message"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
          />
          {isBusy ? (
            <Button type="button" size="icon" variant="secondary" onClick={() => stop()} className="size-11 rounded-full" aria-label="Stop generating">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} className="size-11 rounded-full" aria-label="Send message">
              <ArrowUp className="size-5" />
            </Button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
          Powered by OpenAI. Messages are sent to the model to generate replies.
        </p>
      </div>
    </div>
  )
}
