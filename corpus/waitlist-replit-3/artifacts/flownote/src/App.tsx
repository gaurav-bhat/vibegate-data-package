import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Landing from '@/pages/Landing';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="bg-noise" />
        <Switch>
          <Route path="/" component={Landing} />
          <Route>
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-serif italic text-primary">404</h1>
                <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                <a href="/" className="inline-block mt-4 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Return Home
                </a>
              </div>
            </div>
          </Route>
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
