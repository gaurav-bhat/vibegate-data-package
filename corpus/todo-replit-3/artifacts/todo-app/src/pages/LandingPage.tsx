import { Link } from "wouter";
import { CheckSquare, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${basePath}/logo.svg`} alt="Taskly" className="w-10 h-10" />
            <span className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Taskly
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" data-testid="button-sign-in">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button data-testid="button-sign-up">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          Your focused productivity space
        </div>
        
        <h1 
          className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
          data-testid="text-hero-title"
        >
          Tasks that feel
          <br />
          intentional
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
          A personal task manager designed for clarity and focus. No friction, just what matters—organized, satisfying, yours.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="h-14 px-8 text-base" data-testid="button-cta-primary">
              Start organizing
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" data-testid="button-cta-secondary">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-card border border-card-border rounded-2xl">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <CheckSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Simple by design
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Add tasks, check them off, move on. No categories, tags, or endless settings—just a clean list that works.
            </p>
          </div>

          <div className="p-8 bg-card border border-card-border rounded-2xl">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Instant sync
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Your tasks stay with you across devices. Sign in anywhere and pick up right where you left off.
            </p>
          </div>

          <div className="p-8 bg-card border border-card-border rounded-2xl">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Satisfying to use
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Every interaction feels deliberate. Smooth animations, clean design, and micro-moments that make you want to check things off.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl">
          <h2 
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to focus?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create your free account and start organizing your day.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="h-14 px-8 text-base" data-testid="button-cta-final">
              Get started for free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Taskly. A focused productivity tool.</p>
        </div>
      </footer>
    </div>
  );
}
