import { useState, useEffect, type FormEvent } from 'react';
import {
  NotebookPen,
  Zap,
  Sparkles,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Github,
  Twitter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

const features = [
  {
    icon: Zap,
    title: 'Lightning-fast capture',
    description:
      'Jot down ideas the moment they strike. FlowNote opens instantly and syncs across all your devices in real time.',
  },
  {
    icon: Sparkles,
    title: 'AI that writes with you',
    description:
      'Summarize long threads, draft replies, and turn scattered notes into structured plans with a single click.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    description:
      'Share notebooks, comment in context, and keep everyone aligned without endless status meetings.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    description:
      'End-to-end encryption and granular permissions mean your notes stay yours — always.',
  },
];

const stats = [
  { value: '10k+', label: 'Notes synced daily' },
  { value: '99.9%', label: 'Uptime guaranteed' },
  { value: '4.9★', label: 'Early access rating' },
];

export default function App() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc('waitlist_count');
      if (!active) return;
      if (!error && typeof data === 'number') setCount(data);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailOk) {
      setStatus('error');
      setMessage('That doesn\u2019t look like a valid email.');
      return;
    }

    setStatus('loading');
    setMessage('');
    const { error } = await supabase.from('waitlist').insert({ email: trimmed });

    if (error) {
      if (error.code === '23505') {
        setStatus('success');
        setMessage("You\u2019re already on the list — we\u2019ll be in touch soon!");
        setCount((c) => (c !== null ? c : c));
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again in a moment.');
      }
      return;
    }

    setStatus('success');
    setMessage('You\u2019re on the list! We\u2019ll email you when early access opens.');
    setEmail('');
    setCount((c) => (c !== null ? c + 1 : c));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-teal-400/30">
      <BackgroundGlow />

      {/* Nav */}
      <header className="relative z-20">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20">
              <NotebookPen className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-semibold tracking-tight">FlowNote</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-slate-300 sm:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#waitlist" className="transition hover:text-white">
              Waitlist
            </a>
          </div>
          <a
            href="#waitlist"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-teal-400/50 hover:bg-teal-400/10"
          >
            Join waitlist
          </a>
        </nav>
      </header>

      <main id="top" className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-teal-300">
              <Sparkles className="h-3.5 w-3.5" />
              Now accepting early access requests
            </div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              The notes app that{' '}
              <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">
                thinks with you
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              FlowNote blends fast capture, AI assistance, and real-time
              collaboration into one calm workspace. Stop juggling tabs — start
              turning ideas into action.
            </p>

            {/* Waitlist form */}
            <div id="waitlist" className="mx-auto mt-10 max-w-md scroll-mt-24">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                    aria-label="Email address"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-400/30 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Join waitlist
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {status === 'success' && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-teal-300">
                  <CheckCircle2 className="h-4 w-4" />
                  {message}
                </p>
              )}
              {status === 'error' && (
                <p className="mt-3 text-sm text-rose-400">{message}</p>
              )}

              <p className="mt-3 text-xs text-slate-500">
                {count !== null && count > 0
                  ? `Join ${count.toLocaleString()} ${count === 1 ? 'person' : 'people'} already on the list. `
                  : 'Be the first to get in. '}
                No spam — just one email when we launch.
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 sm:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-semibold text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 border-t border-white/5 bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to stay in flow
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Thoughtfully designed features that get out of your way — until
                you need them.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-teal-400/30 hover:bg-slate-900/80"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 transition group-hover:bg-teal-400 group-hover:text-slate-950">
                    <f.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/40 px-6 py-16 text-center sm:px-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to take notes that work for you?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                Join the waitlist and be among the first to experience FlowNote
                when we open the doors.
              </p>
              <a
                href="#waitlist"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
              >
                Reserve your spot
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-400 text-slate-950">
              <NotebookPen className="h-4 w-4" strokeWidth={2.5} />
            </span>
            FlowNote
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <a href="#" className="transition hover:text-white" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="transition hover:text-white" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FlowNote. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-0 -left-40 h-[25rem] w-[25rem] rounded-full bg-cyan-500/5 blur-[120px]" />
    </div>
  );
}
