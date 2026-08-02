import { ArrowDown } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden"
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60rem] h-[40rem] rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[5%] w-[24rem] h-[24rem] rounded-full bg-emerald-500/15 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Now accepting early access members
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
          Notes that flow
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            with your mind
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed">
          FlowNote is the note-taking app built for how you actually think.
          Capture fast, organize naturally, and find anything in a keystroke —
          powered by AI that writes alongside you.
        </p>

        <div className="mt-10">
          <WaitlistForm />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Join the waitlist — be first to get access. No spam, ever.
        </p>

        <a
          href="#features"
          className="mt-16 inline-flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className="text-xs uppercase tracking-widest">Explore</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
