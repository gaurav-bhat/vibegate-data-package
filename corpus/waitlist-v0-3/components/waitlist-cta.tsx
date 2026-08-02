import { WaitlistForm } from "@/components/waitlist-form"

export function WaitlistCta() {
  return (
    <section id="waitlist" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-sm md:px-12">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Be first to find your flow
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            We&apos;re rolling out access in small batches. Add your email and we&apos;ll let you know the moment your
            invite is ready.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  )
}
