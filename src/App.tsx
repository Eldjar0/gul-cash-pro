import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { GlobalAlerts } from "./components/alerts/GlobalAlerts";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Stats = lazy(() => import("./pages/Stats"));
const Documents = lazy(() => import("./pages/Documents"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const StockHistory = lazy(() => import("./pages/StockHistory"));
const Products = lazy(() => import("./pages/Products"));
const Settings = lazy(() => import("./pages/Settings"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDisplay = lazy(() => import("./pages/CustomerDisplay"));
const LegalInfo = lazy(() => import("./pages/LegalInfo"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvoiceCreate = lazy(() => import("./pages/InvoiceCreate"));
const Inventory = lazy(() => import("./pages/Inventory"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const MobileManagement = lazy(() => import("./pages/MobileManagement"));
const MobileCategories = lazy(() => import("./pages/MobileCategories"));
const MobilePromotions = lazy(() => import("./pages/MobilePromotions"));
const MobileOrders = lazy(() => import("./pages/MobileOrders"));
const MobileCalculator = lazy(() => import("./pages/MobileCalculator"));
const MobileProducts = lazy(() => import("./pages/MobileProducts"));
const DirectCameraScanner = lazy(() => import("./pages/DirectCameraScanner"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-pulse text-foreground">Chargement...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GlobalAlerts />
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/customer-display" element={<CustomerDisplay />} />
            <Route path="/download-app" element={<DownloadApp />} />
            <Route path="/mobile" element={<ProtectedRoute><MobileManagement /></ProtectedRoute>} />
            <Route path="/mobile/management" element={<ProtectedRoute><MobileManagement /></ProtectedRoute>} />
            <Route path="/mobile/products" element={<ProtectedRoute><MobileProducts /></ProtectedRoute>} />
            <Route path="/mobile/categories" element={<ProtectedRoute><MobileCategories /></ProtectedRoute>} />
            <Route path="/mobile/promotions" element={<ProtectedRoute><MobilePromotions /></ProtectedRoute>} />
            <Route path="/mobile/orders" element={<ProtectedRoute><MobileOrders /></ProtectedRoute>} />
            <Route path="/mobile/calculator" element={<ProtectedRoute><MobileCalculator /></ProtectedRoute>} />
            <Route path="/camera-scanner" element={<ProtectedRoute><DirectCameraScanner /></ProtectedRoute>} />
            <Route path="/camera-scanner/:sessionCode" element={<ProtectedRoute><DirectCameraScanner /></ProtectedRoute>} />
            
            {/* Protected routes with navigation */}
            <Route path="/" element={<ProtectedRoute><ProtectedLayout><Index /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><ProtectedLayout><Stats /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><ProtectedLayout><Documents /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/invoices/create" element={<ProtectedRoute><ProtectedLayout><InvoiceCreate /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/promotions" element={<ProtectedRoute><ProtectedLayout><Promotions /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><ProtectedLayout><Suppliers /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/stock-history" element={<ProtectedRoute><ProtectedLayout><StockHistory /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProtectedLayout><Products /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><ProtectedLayout><Customers /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><Settings /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><ProtectedLayout><UserManagement /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/legal-info" element={<ProtectedRoute><ProtectedLayout><LegalInfo /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/getting-started" element={<ProtectedRoute><ProtectedLayout><GettingStarted /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><ProtectedLayout><Inventory /></ProtectedLayout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
