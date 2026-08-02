import { NotebookPen } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300">
      <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
            <NotebookPen className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            FlowNote
          </span>
        </a>
        <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#waitlist" className="hover:text-slate-900 transition-colors">
            Join Waitlist
          </a>
        </div>
        <a
          href="#waitlist"
          className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-full transition-colors shadow-sm"
        >
          Get Early Access
        </a>
      </nav>
    </header>
  );
}
