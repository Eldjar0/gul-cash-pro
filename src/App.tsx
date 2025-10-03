import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/create" element={<InvoiceCreate />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/customer-display" element={<CustomerDisplay />} />
          <Route path="/reports-history" element={<ReportsHistory />} />
          <Route path="/legal-info" element={<LegalInfo />} />
          <Route path="/getting-started" element={<GettingStarted />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
