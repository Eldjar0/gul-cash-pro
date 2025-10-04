import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Sales = lazy(() => import("./pages/Sales"));
const Products = lazy(() => import("./pages/Products"));
const Settings = lazy(() => import("./pages/Settings"));
const Customers = lazy(() => import("./pages/Customers"));
const Invoices = lazy(() => import("./pages/Invoices"));
const CustomerDisplay = lazy(() => import("./pages/CustomerDisplay"));
const ReportsHistory = lazy(() => import("./pages/ReportsHistory"));
const LegalInfo = lazy(() => import("./pages/LegalInfo"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvoiceCreate = lazy(() => import("./pages/InvoiceCreate"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-pulse text-foreground">Chargement...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/customer-display" element={<CustomerDisplay />} />
            
            {/* Protected routes with navigation */}
            <Route path="/" element={<ProtectedRoute><ProtectedLayout><Index /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><ProtectedLayout><Sales /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProtectedLayout><Products /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><ProtectedLayout><Customers /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><ProtectedLayout><Invoices /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/invoices/create" element={<ProtectedRoute><ProtectedLayout><InvoiceCreate /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><Settings /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/reports-history" element={<ProtectedRoute><ProtectedLayout><ReportsHistory /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/legal-info" element={<ProtectedRoute><ProtectedLayout><LegalInfo /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/getting-started" element={<ProtectedRoute><ProtectedLayout><GettingStarted /></ProtectedLayout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
