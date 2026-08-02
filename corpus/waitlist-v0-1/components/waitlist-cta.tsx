import { WaitlistForm } from "@/components/waitlist-form"

export function WaitlistCta() {
  return (
    <section id="waitlist" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-border bg-primary/5 px-6 py-12 text-center md:px-12">
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Be the first to flow
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            Join the waitlist and we&apos;ll send you an invite as soon as your spot opens up.
          </p>
          <div className="mt-8 flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  )
}
