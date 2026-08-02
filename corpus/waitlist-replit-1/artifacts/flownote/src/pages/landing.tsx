import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Zap, Focus, Workflow, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useJoinWaitlist, useGetWaitlistStats, getGetWaitlistStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-[100dvh] w-full">
      {/* Hero Section */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative min-h-[100dvh] flex items-center justify-center px-6 py-24 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-accent/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "-4s" }} />
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary-foreground/10"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-secondary-foreground">Thoughtfully designed for clarity</span>
              </motion.div>
              
              <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-balance">
                Where ideas
                <br />
                <span className="text-primary">find focus</span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-lg leading-relaxed">
              FlowNote transforms scattered thoughts into organized momentum. Capture with ease, focus with clarity, act with intention.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="pt-4"
            >
              <a href="#waitlist">
                <Button 
                  size="lg" 
                  className="text-base px-8 py-6 h-auto group"
                  data-testid="button-hero-cta"
                >
                  Join the waitlist
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Visual representation */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-w-xl mx-auto">
              {/* Floating cards representation */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-72 h-48 bg-card border border-card-border rounded-2xl shadow-lg p-6 backdrop-blur-sm"
              >
                <div className="space-y-3">
                  <div className="h-3 w-24 bg-primary/20 rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                  <div className="h-2 w-5/6 bg-muted rounded" />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-24 right-0 w-64 h-40 bg-card border border-card-border rounded-2xl shadow-lg p-6 backdrop-blur-sm"
              >
                <div className="space-y-3">
                  <div className="h-3 w-20 bg-accent/30 rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                  <div className="h-2 w-4/5 bg-muted rounded" />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-0 left-12 w-80 h-56 bg-card border border-card-border rounded-2xl shadow-xl p-6 backdrop-blur-sm"
              >
                <div className="space-y-3">
                  <div className="h-3 w-28 bg-primary/20 rounded" />
                  <div className="h-2 w-full bg-muted rounded" />
                  <div className="h-2 w-11/12 bg-muted rounded" />
                  <div className="h-2 w-3/4 bg-muted rounded" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6 text-balance">
              Built for how you
              <br />
              <span className="text-primary">actually think</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No friction. No distraction. Just the tools you need to turn thoughts into action.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Instant capture"
              description="Ideas don't wait. FlowNote opens in a heartbeat, ready when inspiration strikes. No loading, no setup, no friction."
              delay={0}
            />
            <FeatureCard
              icon={<Focus className="w-6 h-6" />}
              title="Clarity by design"
              description="Clean layouts and smart organization help you see what matters. Less noise, more signal. Your thoughts, distilled."
              delay={0.1}
            />
            <FeatureCard
              icon={<Workflow className="w-6 h-6" />}
              title="From idea to action"
              description="Turn notes into tasks, tasks into flow. Track momentum without complexity. Progress made visible, naturally."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="relative py-32 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-balance">
              Designed for deep work, not endless features
            </h2>
            <div className="prose prose-lg prose-slate max-w-none">
              <p className="text-xl text-muted-foreground leading-relaxed">
                FlowNote isn't trying to be everything. It's a tool for people who value focus over features, clarity over clutter. We believe the best software disappears into your workflow, supporting your thinking without demanding attention.
              </p>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Every interaction is considered. Every feature earned its place. The result feels less like software and more like an extension of how you already work.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            <div className="text-center space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl text-balance">
                Join a community of focused thinkers
              </h2>
              <p className="text-lg text-muted-foreground">
                Early access opening soon for those who value intentional tools
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Finally, a notes app that doesn't feel like work."
                author="Design lead, early tester"
                delay={0}
              />
              <TestimonialCard
                quote="The clarity I needed without the complexity I didn't."
                author="Product manager, beta user"
                delay={0.1}
              />
              <TestimonialCard
                quote="It just... works. Exactly how I think."
                author="Writer, founding member"
                delay={0.2}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="relative py-32 px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="font-serif text-2xl font-semibold">FlowNote</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with care for people who think deeply
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="space-y-4"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TestimonialCard({ quote, author, delay }: { quote: string; author: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="bg-card border border-card-border rounded-2xl p-8 space-y-4"
    >
      <p className="text-lg font-medium text-balance">{quote}</p>
      <p className="text-sm text-muted-foreground">{author}</p>
    </motion.div>
  );
}

function WaitlistForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const queryClient = useQueryClient();
  const joinWaitlist = useJoinWaitlist();
  const { data: stats } = useGetWaitlistStats();

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: WaitlistFormValues) => {
    setIsDuplicate(false);
    joinWaitlist.mutate(
      { data: values },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetWaitlistStatsQueryKey() });
        },
        onError: (error) => {
          if (error.status === 409) {
            setIsDuplicate(true);
            form.reset();
          } else {
            form.setError("email", {
              message: "Something went wrong. Please try again.",
            });
          }
        },
      }
    );
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-8 py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        
        <div className="space-y-4">
          <h3 className="font-serif text-4xl md:text-5xl">You're on the list</h3>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            We'll reach out soon with early access. In the meantime, we're working hard to make FlowNote worth the wait.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => setIsSubmitted(false)}
          className="text-primary hover:text-primary"
          data-testid="button-submit-another"
        >
          Submit another email
        </Button>
      </motion.div>
    );
  }

  if (isDuplicate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-8 py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/50"
        >
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </motion.div>
        
        <div className="space-y-4">
          <h3 className="font-serif text-4xl md:text-5xl">Already on the waitlist</h3>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            You're all set. We'll be in touch soon with your early access invitation.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => setIsDuplicate(false)}
          className="text-primary hover:text-primary"
          data-testid="button-try-different"
        >
          Try a different email
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-balance">
          Ready to find your flow?
        </h2>
        <p className="text-xl text-muted-foreground">
          Join the waitlist for early access
        </p>
        {stats && stats.count > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground"
            data-testid="text-waitlist-count"
          >
            Join {stats.count.toLocaleString()} {stats.count === 1 ? 'person' : 'others'} already on the waitlist
          </motion.p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="your@email.com"
                    className="h-14 text-lg px-6 bg-card"
                    disabled={joinWaitlist.isPending}
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base"
            disabled={joinWaitlist.isPending}
            data-testid="button-join-waitlist"
          >
            {joinWaitlist.isPending ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
                Joining...
              </motion.span>
            ) : (
              "Get early access"
            )}
          </Button>
        </form>
      </Form>

      <p className="text-sm text-center text-muted-foreground">
        No spam. Just updates when we launch.
      </p>
    </motion.div>
  );
}
