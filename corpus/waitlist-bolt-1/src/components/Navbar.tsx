import { useState, useEffect } from 'react';
import { Feather, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Waitlist', href: '#waitlist' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 shadow-lg shadow-sky-500/20 transition-transform group-hover:scale-105">
            <Feather className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            FlowNote
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#waitlist"
            className="text-sm font-medium px-4 py-2 rounded-full bg-white text-slate-950 hover:bg-sky-100 transition-colors"
          >
            Join waitlist
          </a>
        </div>

        <button
          className="md:hidden text-slate-200"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-white/5">
          <div className="px-6 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setOpen(false)}
              className="text-sm font-medium px-4 py-2 rounded-full bg-white text-slate-950 text-center"
            >
              Join waitlist
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
