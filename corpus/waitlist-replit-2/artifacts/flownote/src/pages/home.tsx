import React, { useState } from 'react';
import { useJoinWaitlist, useGetWaitlistCount, getGetWaitlistCountQueryKey } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { NotebookPen, Layers, Zap, CheckCircle2, Command, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';

const schema = z.object({
  email: z.string().email("Please enter a valid email address.")
});

function WaitlistForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" }
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'duplicate'>('idle');
  const [position, setPosition] = useState<number | null>(null);

  const joinWaitlist = useJoinWaitlist();
  
  const onSubmit = (data: z.infer<typeof schema>) => {
    setStatus('idle');
    joinWaitlist.mutate({ data }, {
      onSuccess: (res) => {
        setStatus('success');
        setPosition(res.position);
        form.reset();
      },
      onError: (err: any) => {
        if (err.status === 409) {
          setStatus('duplicate');
        } else {
          setStatus('error');
        }
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center justify-center p-6 bg-primary/5 border border-primary/20 rounded-xl text-center space-y-2"
          data-testid="waitlist-success"
        >
          <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
          <h3 className="text-lg font-medium text-foreground">You are on the list.</h3>
          <p className="text-sm text-muted-foreground">
            Your position is #{position}. We will be in touch soon.
          </p>
        </motion.div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1 relative">
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        className="h-12 bg-white/50 dark:bg-black/50 backdrop-blur-md border-muted-foreground/20 focus-visible:ring-primary text-base placeholder:text-muted-foreground/60 transition-all hover:bg-white/80 dark:hover:bg-black/80 shadow-sm"
                        {...field}
                        data-testid="input-email"
                        disabled={joinWaitlist.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="h-12 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                disabled={joinWaitlist.isPending}
                data-testid="button-submit-waitlist"
              >
                {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
              </Button>
            </div>
            
            <div className="min-h-[24px]">
              {form.formState.errors.email && (
                <p className="text-sm text-destructive text-center sm:text-left animate-in fade-in slide-in-from-top-1">{form.formState.errors.email.message}</p>
              )}
              {status === 'duplicate' && (
                <p className="text-sm text-muted-foreground text-center sm:text-left animate-in fade-in slide-in-from-top-1">This email is already on the waitlist.</p>
              )}
              {status === 'error' && (
                <p className="text-sm text-destructive text-center sm:text-left animate-in fade-in slide-in-from-top-1">Something went wrong. Please try again.</p>
              )}
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

function WaitlistCount() {
  const { data, isLoading } = useGetWaitlistCount({
    query: {
        queryKey: getGetWaitlistCountQueryKey()
    }
  });

  if (isLoading || !data) return <div className="h-6" />;

  return (
    <motion.p 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-sm text-muted-foreground font-medium flex items-center gap-2 justify-center" 
      data-testid="text-waitlist-count"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      Join {data.count.toLocaleString()} thinkers already on the list
    </motion.p>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col p-8 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 font-sans text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      {/* Background grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-background/60 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <span className="text-sm font-sans font-bold leading-none -mt-0.5">F</span>
            </div>
            FlowNote
          </div>
          <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Join Waitlist
          </Button>
        </div>
      </header>

      <main className="pt-32">
        {/* Hero */}
        <section className="pb-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground mb-8 backdrop-blur-sm shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
            Early Access Opening Soon
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[1.05] tracking-tight mb-6"
          >
            The command center <br className="hidden md:block"/> for your mind.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-sans leading-relaxed"
          >
            FlowNote captures, organizes, and acts on your ideas without the friction of traditional tools. It flows with how you actually think.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="w-full mb-8"
          >
            <WaitlistForm />
          </motion.div>
          
          <WaitlistCount />
        </section>

        {/* Abstract UI Mockup */}
        <section className="w-full max-w-5xl mx-auto px-6 mb-32 relative z-10">
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[4/3] md:aspect-video relative flex ring-1 ring-white/10"
          >
            {/* Top Bar for Mac-like feel */}
            <div className="absolute top-0 left-0 right-0 h-10 border-b border-border/50 bg-muted/20 flex items-center px-4 gap-2 z-20">
              <div className="w-3 h-3 rounded-full bg-border/80"></div>
              <div className="w-3 h-3 rounded-full bg-border/80"></div>
              <div className="w-3 h-3 rounded-full bg-border/80"></div>
            </div>

            {/* Sidebar Mockup */}
            <div className="w-64 bg-muted/20 border-r border-border/50 hidden md:flex flex-col pt-16 px-4 space-y-6">
              <div>
                <div className="h-3 w-20 bg-muted-foreground/30 rounded-full mb-3" />
                <div className="space-y-2">
                  <div className="h-8 w-full bg-primary/10 text-primary flex items-center px-2 rounded-md gap-2">
                    <FileText className="w-4 h-4" />
                    <div className="h-2 w-24 bg-primary/40 rounded-full" />
                  </div>
                  {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-full hover:bg-muted/50 flex items-center px-2 rounded-md gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground/50" />
                      <div className="h-2 w-20 bg-muted-foreground/20 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Area Mockup */}
            <div className="flex-1 pt-20 p-8 md:p-12 flex flex-col relative bg-card/30">
              <div className="h-8 md:h-12 w-3/4 max-w-md bg-foreground/10 rounded-lg mb-8" />
              <div className="space-y-4 max-w-2xl">
                <div className="h-4 w-full bg-muted-foreground/10 rounded-md" />
                <div className="h-4 w-11/12 bg-muted-foreground/10 rounded-md" />
                <div className="h-4 w-4/5 bg-muted-foreground/10 rounded-md" />
                <div className="h-4 w-5/6 bg-muted-foreground/10 rounded-md" />
                <div className="h-4 w-2/3 bg-muted-foreground/10 rounded-md" />
              </div>

              {/* Floating command palette mockup */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-md bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
              >
                <div className="flex items-center px-4 py-3 border-b border-border/50">
                  <Search className="w-4 h-4 text-muted-foreground mr-3" />
                  <div className="h-4 w-40 bg-muted-foreground/20 rounded-full" />
                </div>
                <div className="p-2 space-y-1">
                  <div className="h-10 w-full bg-primary/10 rounded-lg flex items-center px-3 gap-3">
                     <Command className="w-4 h-4 text-primary" />
                     <div className="h-3 w-32 bg-primary/40 rounded-full" />
                  </div>
                  <div className="h-10 w-full bg-transparent rounded-lg flex items-center px-3 gap-3">
                     <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                     <div className="h-3 w-24 bg-muted-foreground/20 rounded-full" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card/50 border-y border-border/40 relative">
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-4xl md:text-5xl font-serif mb-4 text-foreground tracking-tight">Engineered for flow.</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We removed the friction so you can focus on what matters. Your ideas.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard 
                icon={<Zap className="w-6 h-6" />}
                title="Capture without friction"
                desc="Open, type, close. No required folders, no mandatory tags. Just a blank canvas ready for your thoughts the moment they strike."
                delay={0.1}
              />
              <FeatureCard 
                icon={<Layers className="w-6 h-6" />}
                title="Organize by connection"
                desc="FlowNote links your ideas naturally as you type. Watch a knowledge graph emerge without spending hours doing manual organization."
                delay={0.2}
              />
              <FeatureCard 
                icon={<NotebookPen className="w-6 h-6" />}
                title="Act with clarity"
                desc="Turn vague notes into concrete tasks with a single command. Your ideas don't just sit there; they become your workflow."
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-32 px-6 text-center max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-[1.1] tracking-tight text-foreground">
            Stop managing tools.<br/>Start managing thoughts.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join the waitlist today and be among the first to experience the new standard in thought capture.
          </p>
          <div className="w-full mb-8">
            <WaitlistForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 text-center text-sm text-muted-foreground bg-background relative z-10">
        <p>&copy; {new Date().getFullYear()} FlowNote. All rights reserved.</p>
      </footer>
    </div>
  );
}
