import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LandingPage } from '@/pages/LandingPage';
import { TasksPage } from '@/pages/TasksPage';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk" as const,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(262, 60%, 55%)",
    colorForeground: "hsl(258, 20%, 20%)",
    colorMutedForeground: "hsl(258, 12%, 50%)",
    colorDanger: "hsl(0, 72%, 55%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(0, 0%, 100%)",
    colorInputForeground: "hsl(258, 20%, 20%)",
    colorNeutral: "hsl(258, 15%, 88%)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-[hsl(258,15%,88%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(258,20%,20%)] font-semibold text-2xl",
    headerSubtitle: "text-[hsl(258,12%,50%)] text-sm",
    socialButtonsBlockButtonText: "text-[hsl(258,20%,20%)] font-medium",
    formFieldLabel: "text-[hsl(258,20%,30%)] font-medium text-sm",
    footerActionLink: "text-[hsl(262,60%,55%)] font-semibold hover:text-[hsl(262,60%,45%)]",
    footerActionText: "text-[hsl(258,12%,50%)]",
    dividerText: "text-[hsl(258,12%,50%)] text-sm",
    identityPreviewEditButton: "text-[hsl(262,60%,55%)]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-[hsl(258,20%,20%)]",
    logoBox: "h-12 justify-center",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border-[hsl(258,15%,88%)] hover:bg-[hsl(258,30%,95%)]",
    formButtonPrimary: "bg-[hsl(262,60%,55%)] hover:bg-[hsl(262,60%,50%)] text-white font-medium",
    formFieldInput: "border-[hsl(258,15%,88%)] focus:border-[hsl(262,60%,55%)] focus:ring-[hsl(262,60%,55%)]",
    footerAction: "mt-6",
    dividerLine: "bg-[hsl(258,15%,88%)]",
    alert: "border-[hsl(258,15%,88%)]",
    otpCodeFieldInput: "border-[hsl(258,15%,88%)]",
    formFieldRow: "gap-4",
    main: "p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 px-4">
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
      <Show when="signed-in"><Redirect to="/tasks" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function TasksRoute() {
  return (
    <>
      <Show when="signed-in"><TasksPage /></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
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
            title: "Welcome back to Taskly",
            subtitle: "Sign in to access your tasks",
          },
        },
        signUp: {
          start: {
            title: "Start using Taskly",
            subtitle: "Create your account to get organized",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/tasks" component={TasksRoute} />
            <Route component={NotFound} />
          </Switch>
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
