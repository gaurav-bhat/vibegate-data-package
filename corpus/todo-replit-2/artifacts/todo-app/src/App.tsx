import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Landing from '@/pages/landing';
import TasksPage from '@/pages/tasks';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk' as const,
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(158, 48%, 48%)',
    colorForeground: 'hsl(25, 20%, 15%)',
    colorMutedForeground: 'hsl(25, 15%, 45%)',
    colorDanger: 'hsl(8, 75%, 58%)',
    colorBackground: 'hsl(40, 25%, 98%)',
    colorInput: 'hsl(40, 25%, 98%)',
    colorInputForeground: 'hsl(25, 20%, 15%)',
    colorNeutral: 'hsl(40, 18%, 88%)',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-card-border',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-foreground font-semibold text-2xl',
    headerSubtitle: 'text-muted-foreground text-sm',
    socialButtonsBlockButtonText: 'text-foreground font-medium text-sm',
    formFieldLabel: 'text-foreground font-medium text-sm',
    footerActionLink: 'text-primary font-medium hover:text-primary/80',
    footerActionText: 'text-muted-foreground text-sm',
    dividerText: 'text-muted-foreground text-xs uppercase tracking-wide',
    identityPreviewEditButton: 'text-primary hover:text-primary/80',
    formFieldSuccessText: 'text-primary text-sm',
    alertText: 'text-foreground text-sm',
    logoBox: 'h-12 mb-6',
    logoImage: 'h-12 w-12',
    socialButtonsBlockButton: 'border-card-border bg-card hover:bg-muted text-foreground',
    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground font-medium',
    formFieldInput: 'bg-card border-card-border text-foreground',
    footerAction: 'mt-6',
    dividerLine: 'bg-border',
    alert: 'bg-muted border-border',
    otpCodeFieldInput: 'border-card-border text-foreground',
    formFieldRow: 'gap-4',
    main: 'px-8 py-8',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/tasks" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedTasks() {
  return (
    <>
      <Show when="signed-in">
        <TasksPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/tasks" component={ProtectedTasks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to access your tasks',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Start organizing your tasks today',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
