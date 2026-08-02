import {
  Zap,
  Layers,
  Sparkles,
  Search,
  Repeat,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Capture at the speed of thought',
    body: 'A frictionless editor that gets out of your way. Ideas land the moment they arrive — no menus, no loading, no lost momentum.',
  },
  {
    icon: Layers,
    title: 'Structure that grows with you',
    body: 'Nested pages, tags, and smart links keep everything connected. Start messy, stay organized — your notes scale from a scribble to a system.',
  },
  {
    icon: Search,
    title: 'Find anything in one keystroke',
    body: 'Full-text search across every note, tag, and link. Recall the right thought instantly, even months after you wrote it.',
  },
  {
    icon: Sparkles,
    title: 'AI that writes with you',
    body: 'Summarize, outline, and draft from a prompt. FlowNote understands your context and helps you turn rough notes into finished work.',
  },
  {
    icon: Repeat,
    title: 'Sync across every device',
    body: 'Real-time sync keeps your workspace identical on desktop, web, and mobile. Pick up exactly where you left off, anywhere.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'End-to-end encryption and granular sharing controls. Your notes stay yours — share only what you choose, with whom you choose.',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-sky-400">
            Features
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Everything you need to think clearly
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            FlowNote brings the speed of a scratchpad and the structure of a
            wiki into one calm, connected workspace.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-sky-400/30 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-white/10 grid place-items-center mb-5 transition-transform group-hover:scale-105">
                <Icon className="w-5 h-5 text-sky-300" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
