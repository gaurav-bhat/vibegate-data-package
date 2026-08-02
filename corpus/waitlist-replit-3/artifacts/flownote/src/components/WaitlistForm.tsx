import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useJoinWaitlist } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Check, ArrowRight } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export function WaitlistForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const joinWaitlist = useJoinWaitlist();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    joinWaitlist.mutate(
      { data: { email: values.email } },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: () => {
          form.setError('email', { message: 'Something went wrong. Please try again.' });
        }
      }
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center space-x-3 text-primary bg-primary/10 px-5 py-4 rounded-lg border border-primary/20 backdrop-blur-sm">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Check className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium">You're on the list. We'll be in touch.</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row w-full max-w-md items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1 w-full relative">
              <FormControl>
                <Input 
                  placeholder="Enter your email..." 
                  className="bg-black/40 border-white/10 text-white placeholder:text-white/40 h-12 px-4 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-lg backdrop-blur-sm" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-destructive mt-2 text-sm absolute -bottom-6 left-0" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          size="lg" 
          className="w-full sm:w-auto h-12 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg shadow-[0_0_20px_rgba(212,163,115,0.3)] transition-all hover:shadow-[0_0_30px_rgba(212,163,115,0.5)]"
          disabled={joinWaitlist.isPending}
        >
          {joinWaitlist.isPending ? 'Joining...' : 'Join Waitlist'}
          {!joinWaitlist.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </Form>
  );
}
