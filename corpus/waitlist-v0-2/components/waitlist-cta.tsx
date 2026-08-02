import { WaitlistForm } from "@/components/waitlist-form"

export function WaitlistCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm sm:px-12">
          <h2 className="font-serif text-4xl tracking-tight text-balance text-foreground sm:text-5xl">
            Be the first to find your flow
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">
            Join the waitlist and we&apos;ll send you an invite as soon as your spot opens up.
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  )
}
