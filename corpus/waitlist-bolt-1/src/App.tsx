import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import WaitlistForm from '@/components/WaitlistForm';
import { Feather, Twitter, Github } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-400/30">
      <Navbar />

      <main>
        <Hero />
        <Features />

        {/* Final CTA */}
        <section id="waitlist" className="relative py-24 sm:py-32 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] rounded-full bg-sky-500/15 blur-[120px]" />
          </div>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Be among the first to try FlowNote
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              We're opening access in small batches. Drop your email and we'll
              send your invite the moment your spot opens up.
            </p>
            <div className="mt-10">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400">
              <Feather className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
            </span>
            <span className="font-semibold text-white">FlowNote</span>
            <span className="text-sm text-slate-500 ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <a href="#" aria-label="Twitter" className="hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" aria-label="GitHub" className="hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
