import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const validate = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!validate(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email: trimmed });

      if (error) {
        // 23505 = unique_violation (already on the waitlist)
        if (error.code === '23505') {
          setStatus('success');
          setMessage("You're already on the waitlist — we'll be in touch soon.");
          setEmail('');
          return;
        }
        throw error;
      }

      setStatus('success');
      setMessage("You're on the list! We'll email you when FlowNote is ready.");
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again in a moment.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto" noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="you@example.com"
          disabled={status === 'loading'}
          aria-label="Email address"
          className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-transparent transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-slate-950 font-semibold hover:bg-sky-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Join waitlist
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 flex items-center justify-center gap-2 text-sm ${
            status === 'success' ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
    </form>
  );
}
