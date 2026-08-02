import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!validateEmail(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: trimmed });

    if (error) {
      if (error.code === '23505') {
        setStatus('success');
        setMessage("You're already on the waitlist! We'll be in touch soon.");
        return;
      }
      setStatus('error');
      setMessage('Something went wrong. Please try again in a moment.');
      return;
    }

    setStatus('success');
    setMessage("You're on the list! We'll email you when early access opens.");
    setEmail('');
  };

  return (
    <section id="waitlist" className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-14 sm:px-14 sm:py-16 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Join the FlowNote waitlist
            </h2>
            <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">
              Be first in line when we open early access. Enter your email and
              we'll let you know the moment it's ready.
            </p>

            {status === 'success' ? (
              <div className="mt-8 mx-auto max-w-md flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>
                <p className="text-emerald-300 font-medium text-lg">
                  {message}
                </p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                  }}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Add another email
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 mx-auto max-w-md"
                noValidate
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="you@example.com"
                    disabled={status === 'loading'}
                    className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent backdrop-blur transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="group inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Now
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="mt-4 flex items-center justify-center gap-2 text-amber-300 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {message}
                  </p>
                )}
              </form>
            )}

            <p className="mt-6 text-sm text-slate-400">
              We respect your inbox. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
