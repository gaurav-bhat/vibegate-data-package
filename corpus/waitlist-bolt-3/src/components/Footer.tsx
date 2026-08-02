import { NotebookPen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
            <NotebookPen className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="font-semibold text-slate-900">FlowNote</span>
        </div>
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} FlowNote. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
