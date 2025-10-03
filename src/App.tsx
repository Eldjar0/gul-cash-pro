import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
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
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/invoices/create" element={<ProtectedRoute><InvoiceCreate /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/reports-history" element={<ProtectedRoute><ReportsHistory /></ProtectedRoute>} />
          <Route path="/legal-info" element={<ProtectedRoute><LegalInfo /></ProtectedRoute>} />
          <Route path="/getting-started" element={<ProtectedRoute><GettingStarted /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
