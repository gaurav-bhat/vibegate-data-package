import { Brain, Link2, Zap, Search, Layout, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI that connects the dots',
    description:
      'FlowNote understands your notes and surfaces relevant connections automatically, so insights find you instead of the other way around.',
  },
  {
    icon: Link2,
    title: 'Link anything to anything',
    description:
      'Bi-directional links let your notes reference each other naturally, building a living web of knowledge that grows with you.',
  },
  {
    icon: Zap,
    title: 'Capture in seconds',
    description:
      'A quick command palette and frictionless capture mean your best ideas are saved before they slip away. No setup required.',
  },
  {
    icon: Search,
    title: 'Find anything instantly',
    description:
      'Search across every note, link, and tag with lightning-fast full-text search that understands natural language queries.',
  },
  {
    icon: Layout,
    title: 'Organize without effort',
    description:
      'Smart boards auto-group related notes so your workspace stays tidy without you spending time filing things away.',
  },
  {
    icon: ShieldCheck,
    title: 'Yours, privately',
    description:
      'End-to-end encryption keeps your thoughts yours. Your data is never used to train models or sold to anyone.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Features
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Everything you need to think clearly
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Thoughtfully designed tools that stay out of your way and help you
            focus on what matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative p-7 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-5 group-hover:from-emerald-100 group-hover:to-teal-100 transition-colors">
                  <Icon className="w-6 h-6 text-emerald-600" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-[15px]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
