import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Sparkles, BrainCircuit, Zap, ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

// We use the exact generated assets. Note that the images might still be generating,
// but their paths are predictable based on the GenerateImage call.
import heroBgPath from "@assets/generated_images/hero-bg.jpg";
import featureNodesPath from "@assets/generated_images/feature-nodes.jpg";
import visionBgPath from "@assets/generated_images/vision-bg.jpg";

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md border-b border-white/5 bg-background/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-primary/20 flex items-center justify-center border border-primary/30">
            <Zap className="w-3 h-3 text-primary" />
          </div>
          <span className="font-serif text-xl tracking-wide text-foreground">FlowNote</span>
        </div>
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground font-medium"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Join Waitlist
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Cinematic Background */}
        <motion.div 
          style={{ y: yHero, opacity: opacityHero }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
          <img 
            src={heroBgPath} 
            alt="Cinematic desk background" 
            className="w-full h-full object-cover object-center opacity-60 mix-blend-screen"
          />
        </motion.div>

        <div className="container px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>The next generation of thought</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif leading-[0.9] tracking-tight mb-8">
              Think <span className="text-primary italic pr-4">clearly.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-12 font-light">
              FlowNote is the personal workspace for ambitious thinkers. Effortless capture, automatic organization, and ideas that actually connect.
            </p>

            <WaitlistForm />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-20 py-32 bg-background border-t border-white/5">
        <div className="container px-6 mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight mb-6">Designed for <br/><span className="text-primary italic">flow.</span></h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Traditional note apps force you into rigid hierarchies. FlowNote adapts to your brain's natural associative networks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              delay={0.1}
              icon={<Zap className="w-6 h-6 text-primary" />}
              title="Speed of thought"
              description="Capture ideas instantly. A frictionless editor that gets out of your way and lets you write without distraction."
            />
            <FeatureCard 
              delay={0.2}
              icon={<BrainCircuit className="w-6 h-6 text-primary" />}
              title="Context, not folders"
              description="Stop organizing. FlowNote automatically tags and connects related thoughts using intelligent semantic linking."
            />
            <FeatureCard 
              delay={0.3}
              icon={<Sparkles className="w-6 h-6 text-primary" />}
              title="Surface the right idea"
              description="Never lose a thought again. Ask questions to your own knowledge base and let AI synthesize your notes."
            />
          </div>
        </div>
      </section>

      {/* The Vision (Split Section) */}
      <section className="relative z-20 bg-background overflow-hidden border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative h-[50vh] lg:h-auto min-h-[600px] border-r border-white/5">
            <img 
              src={visionBgPath} 
              alt="Writer's desk at night" 
              className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-background lg:bg-gradient-to-t lg:from-background lg:to-transparent" />
          </div>
          
          <div className="flex flex-col justify-center p-12 md:p-24 bg-card/30">
            <Quote className="w-12 h-12 text-primary/40 mb-8" />
            <h3 className="text-3xl md:text-4xl font-serif leading-tight mb-6">
              We built FlowNote because we were <span className="italic text-primary">drowning</span> in our own ideas.
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Folders are where thoughts go to die. We needed a tool that works the way the brain actually works—associative, fast, and fluid. 
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              A place where a 3 AM shower thought can effortlessly connect to a meeting note from three months ago. That's the power of FlowNote.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary border border-white/10 flex items-center justify-center font-serif text-lg">
                F
              </div>
              <div>
                <p className="font-medium text-foreground">The FlowNote Team</p>
                <p className="text-sm text-muted-foreground">San Francisco, CA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-20 py-32 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <img 
            src={featureNodesPath} 
            alt="Nodes background" 
            className="w-full h-full object-cover opacity-20 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        
        <div className="container relative z-10 px-6 mx-auto flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-7xl font-serif tracking-tight mb-8">
            Your mind, <span className="italic text-primary">amplified.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-xl">
            Join the waitlist today to get early access to the workspace you've always wished you had.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/5 bg-background py-12">
        <div className="container px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-serif text-lg tracking-wide text-foreground">FlowNote</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Manifesto</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} FlowNote. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/30 transition-colors group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-3 text-foreground tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
