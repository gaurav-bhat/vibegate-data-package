import { Chat } from "@/components/chat"

export default function Page() {
  return (
    <main className="flex h-dvh flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            AI
          </span>
          <h1 className="text-sm font-semibold text-foreground">Chat Assistant</h1>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Chat />
      </div>
    </main>
  )
}
