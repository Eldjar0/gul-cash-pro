import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Stats = lazy(() => import("./pages/Stats"));
const Documents = lazy(() => import("./pages/Documents"));
const Promotions = lazy(() => import("./pages/Promotions"));
const InventoryManagement = lazy(() => import("./pages/InventoryManagement"));
const Settings = lazy(() => import("./pages/Settings"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDisplay = lazy(() => import("./pages/CustomerDisplay"));
const LegalInfo = lazy(() => import("./pages/LegalInfo"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvoiceCreate = lazy(() => import("./pages/InvoiceCreate"));
const Analytics = lazy(() => import("./pages/Analytics"));
const DownloadApp = lazy(() => import("./pages/DownloadApp"));
const DownloadDesktopApp = lazy(() => import("./pages/DownloadDesktopApp"));
const Losses = lazy(() => import("./pages/Losses"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const MobileManagement = lazy(() => import("./pages/MobileManagement"));
const MobileCategories = lazy(() => import("./pages/MobileCategories"));
const MobileCalculator = lazy(() => import("./pages/MobileCalculator"));
const MobileProducts = lazy(() => import("./pages/MobileProducts"));
const MobileProductManager = lazy(() => import("./components/mobile/MobileProductManager"));
const MobileCategoryManager = lazy(() => import("./components/mobile/MobileCategoryManager"));
const MobileProductDetail = lazy(() => import("./components/mobile/MobileProductDetail"));
const MobileProductForm = lazy(() => import("./components/mobile/MobileProductForm"));
const DirectCameraScanner = lazy(() => import("./pages/DirectCameraScanner"));
const MobileStats = lazy(() => import("./pages/MobileStats"));
const MobileAlerts = lazy(() => import("./pages/MobileAlerts"));
const MobileSales = lazy(() => import("./pages/MobileSales"));
const MobileCustomers = lazy(() => import("./pages/MobileCustomers"));
const MobileCashRegister = lazy(() => import("./pages/MobileCashRegister"));
const MobileCustomerDetail = lazy(() => import("./components/mobile/MobileCustomerDetail"));
const MobileRapidScan = lazy(() => import("./pages/MobileRapidScan"));
const MobileLowStockList = lazy(() => import("./pages/MobileLowStockList"));
const MobileStockAdjust = lazy(() => import("./pages/MobileStockAdjust"));
const MobilePOS = lazy(() => import("./pages/MobilePOS"));
const MobileCustomerSpecialPricesPage = lazy(() => import("./pages/MobileCustomerSpecialPrices"));
const SupplierEntry = lazy(() => import("./pages/SupplierEntry"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-pulse text-foreground">Chargement...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
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
            <Route path="/download-desktop" element={<DownloadDesktopApp />} />
            <Route path="/legal-info" element={<LegalInfo />} />
            <Route path="/getting-started" element={<GettingStarted />} />
            <Route path="/mobile" element={<ProtectedRoute><MobileManagement /></ProtectedRoute>} />
            <Route path="/mobile/management" element={<ProtectedRoute><MobileManagement /></ProtectedRoute>} />
            <Route path="/mobile/products" element={<ProtectedRoute><MobileProductManager /></ProtectedRoute>} />
            <Route path="/mobile/product/:id" element={<ProtectedRoute><MobileProductDetail /></ProtectedRoute>} />
            <Route path="/mobile/product/:id/edit" element={<ProtectedRoute><MobileProductForm /></ProtectedRoute>} />
            <Route path="/mobile/product/:id/adjust-stock" element={<ProtectedRoute><MobileStockAdjust /></ProtectedRoute>} />
            <Route path="/mobile/product/new" element={<ProtectedRoute><MobileProductForm /></ProtectedRoute>} />
            <Route path="/mobile/categories" element={<ProtectedRoute><MobileCategoryManager /></ProtectedRoute>} />
            <Route path="/mobile/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
            <Route path="/mobile/calculator" element={<ProtectedRoute><MobileCalculator /></ProtectedRoute>} />
            <Route path="/mobile/stats" element={<ProtectedRoute><MobileStats /></ProtectedRoute>} />
            <Route path="/mobile/alerts" element={<ProtectedRoute><MobileAlerts /></ProtectedRoute>} />
            <Route path="/mobile/sales" element={<ProtectedRoute><MobileSales /></ProtectedRoute>} />
            <Route path="/mobile/customers" element={<ProtectedRoute><MobileCustomers /></ProtectedRoute>} />
            <Route path="/mobile/customer/:id" element={<ProtectedRoute><MobileCustomerDetail /></ProtectedRoute>} />
            <Route path="/mobile/customer/:customerId/special-prices" element={<ProtectedRoute><MobileCustomerSpecialPricesPage /></ProtectedRoute>} />
            <Route path="/mobile/cash-register" element={<ProtectedRoute><MobileCashRegister /></ProtectedRoute>} />
            <Route path="/mobile/scan-rapid" element={<ProtectedRoute><MobileRapidScan /></ProtectedRoute>} />
            <Route path="/mobile/low-stock" element={<ProtectedRoute><MobileLowStockList /></ProtectedRoute>} />
            <Route path="/mobile/pos" element={<ProtectedRoute><MobilePOS /></ProtectedRoute>} />
            <Route path="/camera-scanner" element={<ProtectedRoute><DirectCameraScanner /></ProtectedRoute>} />
            <Route path="/camera-scanner/:sessionCode" element={<ProtectedRoute><DirectCameraScanner /></ProtectedRoute>} />
            
            {/* Protected routes with navigation */}
            <Route path="/" element={<ProtectedRoute><ProtectedLayout><Index /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><ProtectedLayout><Stats /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><ProtectedLayout><Documents /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/invoices/create" element={<ProtectedRoute><ProtectedLayout><InvoiceCreate /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/inventory-management" element={<ProtectedRoute><ProtectedLayout><InventoryManagement /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/promotions" element={<ProtectedRoute><ProtectedLayout><Promotions /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/losses" element={<ProtectedRoute><ProtectedLayout><Losses /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><Settings /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><ProtectedLayout><Customers /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><ProtectedLayout><Analytics /></ProtectedLayout></ProtectedRoute>} />
            {/* Old routes redirected to new unified page */}
            <Route path="/products" element={<ProtectedRoute><ProtectedLayout><InventoryManagement /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><ProtectedLayout><InventoryManagement /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><ProtectedLayout><InventoryManagement /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/supplier-entry" element={<ProtectedRoute><ProtectedLayout><SupplierEntry /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><ProtectedLayout><Documents /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><ProtectedLayout><Documents /></ProtectedLayout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
