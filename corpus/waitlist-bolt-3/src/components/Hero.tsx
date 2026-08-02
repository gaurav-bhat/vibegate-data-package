import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 px-6 overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/40 to-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6 animate-[fadeIn_0.6s_ease-out]">
          <Sparkles className="w-4 h-4" />
          Now accepting early access signups
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]">
          Notes that flow
          <br />
          <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
            with your thinking
          </span>
        </h1>

        <p className="mt-7 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          FlowNote is an AI-powered workspace that connects your scattered
          notes, ideas, and tasks into one calm, organized flow. Stop searching.
          Start flowing.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#waitlist"
            className="group inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5"
          >
            Join the Waitlist
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold px-7 py-3.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white/60 backdrop-blur transition-all"
          >
            See Features
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Join 2,000+ people on the waitlist. No spam, ever.
        </p>
      </div>
    </section>
  );
}
