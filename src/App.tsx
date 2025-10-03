import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import CustomerDisplay from "./pages/CustomerDisplay";
import ReportsHistory from "./pages/ReportsHistory";
import LegalInfo from "./pages/LegalInfo";
import GettingStarted from "./pages/GettingStarted";
import NotFound from "./pages/NotFound";
import InvoiceCreate from "./pages/InvoiceCreate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
