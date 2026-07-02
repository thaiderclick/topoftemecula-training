import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import Admin from "./pages/Admin";
import Crm from "./pages/Crm";
import Home from "./pages/Home";
import Roleplay from "./pages/Roleplay";
import Safety from "./pages/Safety";
import Verify from "./pages/Verify";

/**
 * Smart landing: certified ambassadors live in the Field CRM, so "/" sends them
 * there; everyone else gets the training portal. Training stays reachable for
 * graduates at /learn (the "Learning Center" link in the CRM).
 */
function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const credential = trpc.credential.mine.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  if (loading || (isAuthenticated && credential.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isAuthenticated && credential.data) return <Redirect to="/crm" />;
  return <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/learn" component={Home} />
      <Route path="/roleplay" component={Roleplay} />
      <Route path="/safety" component={Safety} />
      <Route path="/crm" component={Crm} />
      <Route path="/admin" component={Admin} />
      <Route path="/verify/:code" component={Verify} />
      <Route path="/verify" component={Verify} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
