import { Link } from 'wouter';
import { CheckCircle2, ListTodo, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        {/* Header */}
        <header className="mb-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Taskly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" data-testid="link-sign-in">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button data-testid="link-sign-up">Get Started</Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mb-32 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/40 px-4 py-2 text-sm font-medium text-accent-foreground">
            <Sparkles className="h-4 w-4" />
            Your personal productivity companion
          </div>
          <h1 className="mb-6 text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Focus on what matters.<br />
            <span className="text-primary">Get things done.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Taskly is a clean, focused task manager that helps you organize your day without the clutter. 
            Simple, intentional, and built for people who value their time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-base px-8" data-testid="button-hero-signup">
                Start for free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8" data-testid="button-hero-signin">
                Sign in to your account
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mb-32 grid gap-12 sm:grid-cols-3">
          <div className="text-center sm:text-left">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ListTodo className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Clean Interface</h3>
            <p className="text-muted-foreground leading-relaxed">
              No distractions. Just your tasks and the space to think clearly about what needs to happen next.
            </p>
          </div>
          <div className="text-center sm:text-left">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Satisfying Interactions</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every check-off feels rewarding. Smooth animations and thoughtful feedback make managing tasks a pleasure.
            </p>
          </div>
          <div className="text-center sm:text-left">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Always Accessible</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your tasks sync across devices. Start on your phone, finish on your laptop. It just works.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-card border border-card-border p-12 text-center shadow-md">
          <h2 className="mb-4 text-3xl font-bold text-foreground">Ready to get organized?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground leading-relaxed">
            Join thousands of people who've simplified their lives with Taskly.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-base px-8" data-testid="button-cta-signup">
              Create your free account
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
