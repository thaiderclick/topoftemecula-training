import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import Crm from "./pages/Crm";
import Home from "./pages/Home";
import Roleplay from "./pages/Roleplay";
import Safety from "./pages/Safety";
import Verify from "./pages/Verify";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
