import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Scan, CreditCard, Banknote, Trash2, ShoppingBag, Percent,
  Clock, Calendar, CalendarX, FileText, TrendingUp, TrendingDown,
  Split, Eye, Calculator, Euro
} from 'lucide-react';
import logoMarket from '@/assets/logo-market.png';
import { CategoryGrid } from '@/components/pos/CategoryGrid';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { MixedPaymentDialog } from '@/components/pos/MixedPaymentDialog';
import { DiscountDialog } from '@/components/pos/DiscountDialog';
import { PromoCodeDialog } from '@/components/pos/PromoCodeDialog';
import { CustomerDialog } from '@/components/pos/CustomerDialog';
import { Receipt } from '@/components/pos/Receipt';
import { PinLockDialog } from '@/components/pos/PinLockDialog';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { RemoteScanDialog } from '@/components/pos/RemoteScanDialog';
import { PhysicalScanActionDialog } from '@/components/pos/PhysicalScanActionDialog';
import { ThermalReceipt, printThermalReceipt } from '@/components/pos/ThermalReceipt';
import { OpenDayDialog } from '@/components/pos/OpenDayDialog';
import { ReportXDialog } from '@/components/pos/ReportXDialog';
import { CloseDayDialog } from '@/components/pos/CloseDayDialog';
import { Product, useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeScannedItems, useMarkItemProcessed } from '@/hooks/useRemoteScan';
import { useCreateSale, useSales } from '@/hooks/useSales';
import { useCategories } from '@/hooks/useCategories';
import { Customer } from '@/hooks/useCustomers';
import { useTodayReport, useOpenDay, useCloseDay, getTodayReportData, ReportData } from '@/hooks/useDailyReports';
import { useWeather } from '@/hooks/useWeather';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { createSafeBroadcastChannel } from '@/lib/safeBroadcast';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
  custom_price?: number;
  discount?: { type: DiscountType; value: number };
  subtotal: number;
  vatAmount: number;
  total: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate('/mobile', { replace: true });
    }
  }, [navigate]);

  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createSale = useCreateSale();
  const scanInputRef = useRef<HTMLInputElement>(null);
  const { temperature, loading: weatherLoading } = useWeather();

  // Get today's and yesterday's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { data: todaySales } = useSales(today, tomorrow);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const { data: yesterdaySales } = useSales(yesterday, today);

  const todayTotal = todaySales?.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0) || 0;
  const yesterdayTotal = yesterdaySales?.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0) || 0;
  const todayCount = todaySales?.filter(s => !s.is_cancelled).length || 0;
  const yesterdayCount = yesterdaySales?.filter(s => !s.is_cancelled).length || 0;

  const totalPercentChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
  const countPercentChange = yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 : 0;

  const [isLocked, setIsLocked] = useState(false);

  const { data: todayReport } = useTodayReport();
  const openDay = useOpenDay();
  const closeDay = useCloseDay();
  const [isDayOpenLocal, setIsDayOpenLocal] = useState<boolean | null>(null);
  const isDayOpenEffective = isDayOpenLocal ?? !!todayReport;

  useEffect(() => {
    setIsDayOpenLocal(null);
  }, [todayReport?.id, todayReport?.closing_amount]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [scanInput, setScanInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quantityInput, setQuantityInput] = useState('1');
  const [calcMode, setCalcMode] = useState<'input' | 'math'>('input');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<{ type: DiscountType; value: number } | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<{ type: 'item' | 'global'; index?: number } | null>(null);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<{ code: string; type: 'percentage' | 'amount'; value: number } | null>(null);
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [printConfirmDialogOpen, setPrintConfirmDialogOpen] = useState(false);
  const [customerDisplayWindow, setCustomerDisplayWindow] = useState<Window | null>(null);
  const [displayChannel] = useState(() => createSafeBroadcastChannel('customer_display'));

  const [openDayDialogOpen, setOpenDayDialogOpen] = useState(false);
  const [closeDayDialogOpen, setCloseDayDialogOpen] = useState(false);
  const [reportXDialogOpen, setReportXDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [mixedPaymentDialogOpen, setMixedPaymentDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [remoteScanSessionId, setRemoteScanSessionId] = useState<string | null>(null);
  const markItemProcessed = useMarkItemProcessed();

  const [physicalScanDialogOpen, setPhysicalScanDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // Calculate totals for cart
  const getTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = cart.reduce((sum, item) => sum + item.vatAmount, 0);
    const itemDiscounts = cart.reduce((sum, item) => {
      if (item.discount) {
        const discountAmount = item.discount.type === 'percentage'
          ? (item.subtotal * item.discount.value) / 100
          : item.discount.value;
        return sum + discountAmount;
      }
      return sum;
    }, 0);

    let total = cart.reduce((sum, item) => sum + item.total, 0);
    let globalDiscountAmount = 0;
    let promoCodeAmount = 0;

    if (globalDiscount) {
      globalDiscountAmount = globalDiscount.type === 'percentage'
        ? (total * globalDiscount.value) / 100
        : globalDiscount.value;
      total -= globalDiscountAmount;
    }

    if (appliedPromoCode) {
      promoCodeAmount = appliedPromoCode.type === 'percentage'
        ? (total * appliedPromoCode.value) / 100
        : appliedPromoCode.value;
      total -= promoCodeAmount;
    }

    const totalDiscount = itemDiscounts + globalDiscountAmount + promoCodeAmount;

    return { subtotal, totalVat, totalDiscount, total };
  };

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Normalize barcode input
  const normalizeBarcode = (barcode: string) => barcode.trim();

  // Calculate item total with discounts and VAT
  const calculateItemTotal = (item: CartItem) => {
    const price = item.custom_price ?? item.product.price;
    const subtotal = price * item.quantity;
    let discountAmount = 0;
    if (item.discount) {
      discountAmount = item.discount.type === 'percentage'
        ? (subtotal * item.discount.value) / 100
        : item.discount.value;
    }
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = subtotalAfterDiscount * (item.product.vat_rate / 100);
    const total = subtotalAfterDiscount + vatAmount;
    return { subtotal, vatAmount, total };
  };

  // Handle product selection from category grid or search
  const handleProductSelect = (product: Product) => {
    setSelectedCategory(null);
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      const totals = calculateItemTotal(newCart[existingIndex]);
      newCart[existingIndex].subtotal = totals.subtotal;
      newCart[existingIndex].vatAmount = totals.vatAmount;
      newCart[existingIndex].total = totals.total;
      setCart(newCart);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        subtotal: product.price,
        vatAmount: product.price * (product.vat_rate / 100),
        total: product.price * (1 + product.vat_rate / 100),
      };
      setCart([...cart, newItem]);
    }
  };

  // Handle physical scan action dialog
  const handlePhysicalScan = (barcode: string) => {
    setScannedBarcode(barcode);
    const product = products?.find(p => p.barcode === barcode) || null;
    setScannedProduct(product);
    setPhysicalScanDialogOpen(true);
  };

  // Handle barcode scan input
  const handleBarcodeScan = (barcode: string) => {
    const normalized = normalizeBarcode(barcode);
    if (!normalized) return;

    const product = products?.find(p => p.barcode === normalized);
    if (product) {
      handleProductSelect(product);
      setScanInput('');
      if (scanInputRef.current) {
        scanInputRef.current.focus();
      }
    } else {
      toast.error('Produit non trouvé');
    }
  };

  // Handle search input change
  const handleSearch = (query: string) => {
    setScanInput(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = products?.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.barcode.includes(lowerQuery)) || [];
    setSearchResults(results);
  };

  // Handle quantity input change
  const handleQuantityChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantityInput(value);
    }
  };

  // Calculator input handling
  const handleCalculator = (input: string) => {
    if (calcMode === 'input') {
      if (input === 'C') {
        setCurrentValue(null);
        setOperation(null);
        setWaitingForOperand(false);
      } else if (input === '+' || input === '-' || input === '*' || input === '/') {
        if (currentValue !== null) {
          setOperation(input);
          setWaitingForOperand(true);
        }
      } else if (input === '=') {
        if (operation && currentValue !== null && !waitingForOperand) {
          try {
            // eslint-disable-next-line no-eval
            const result = eval(`${currentValue} ${operation} ${quantityInput}`);
            setCurrentValue(result);
            setQuantityInput(result.toString());
            setOperation(null);
            setWaitingForOperand(false);
          } catch {
            toast.error('Erreur de calcul');
          }
        }
      } else {
        if (waitingForOperand) {
          setQuantityInput(input);
          setWaitingForOperand(false);
        } else {
          setQuantityInput(prev => (prev === '0' ? input : prev + input));
        }
      }
    }
  };

  // Handle item quantity increase/decrease
  const handleItemAction = (index: number, action: 'increase' | 'decrease') => {
    const newCart = [...cart];
    if (action === 'increase') {
      newCart[index].quantity += 1;
    } else if (action === 'decrease') {
      newCart[index].quantity = Math.max(1, newCart[index].quantity - 1);
    }
    const totals = calculateItemTotal(newCart[index]);
    newCart[index].subtotal = totals.subtotal;
    newCart[index].vatAmount = totals.vatAmount;
    newCart[index].total = totals.total;
    setCart(newCart);
  };

  // Remove item from cart
  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Apply discount to item or global
  const handleApplyDiscount = (type: DiscountType, value: number) => {
    if (!discountTarget) return;
    if (discountTarget.type === 'item' && discountTarget.index !== undefined) {
      const newCart = [...cart];
      newCart[discountTarget.index].discount = { type, value };
      const totals = calculateItemTotal(newCart[discountTarget.index]);
      newCart[discountTarget.index].subtotal = totals.subtotal;
      newCart[discountTarget.index].vatAmount = totals.vatAmount;
      newCart[discountTarget.index].total = totals.total;
      setCart(newCart);
    } else if (discountTarget.type === 'global') {
      setGlobalDiscount({ type, value });
    }
    setDiscountDialogOpen(false);
    setDiscountTarget(null);
  };

  // Apply promo code
  const handleApplyPromo = (code: string, type: DiscountType, value: number) => {
    setAppliedPromoCode({ code, type, value });
    setPromoDialogOpen(false);
  };

  // Open customer display window
  const handleOpenCustomerDisplay = () => {
    if (customerDisplayWindow && !customerDisplayWindow.closed) {
      customerDisplayWindow.focus();
      return;
    }
    const newWindow = window.open('/customer-display', 'CustomerDisplay', 'width=400,height=600');
    setCustomerDisplayWindow(newWindow);
  };

  // Complete payment process
  const handleCompletePayment = (method: 'cash' | 'card' | 'mixed') => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }
    setPaymentDialogOpen(true);
  };

  // Open day dialog
  const handleOpenDay = (amount: number) => {
    openDay.mutate({ opening_amount: amount }, {
      onSuccess: () => {
        setIsDayOpenLocal(true);
        setOpenDayDialogOpen(false);
        toast.success('Journée ouverte');
      },
      onError: () => {
        toast.error('Erreur lors de l\'ouverture de la journée');
      }
    });
  };

  // Report X dialog
  const handleReportX = () => {
    setReportXDialogOpen(true);
  };

  // Close day dialog
  const handleCloseDay = (amount: number) => {
    if (!todayReport) return;
    closeDay.mutate({ id: todayReport.id, closing_amount: amount }, {
      onSuccess: () => {
        setIsDayOpenLocal(false);
        setCloseDayDialogOpen(false);
        toast.success('Journée clôturée');
      },
      onError: () => {
        toast.error('Erreur lors de la clôture de la journée');
      }
    });
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setGlobalDiscount(null);
    setAppliedPromoCode(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      {/* Compact Header with Stats */}
      <div className="bg-gradient-to-r from-primary via-primary-glow to-primary border-b-2 border-primary/30 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Day Status */}
            <div className="flex items-center gap-4">
              <img src={logoMarket} alt="Logo" className="h-12 w-12 rounded-lg shadow-lg" />
              <div>
                <h1 className="text-2xl font-black text-white">CAISSE</h1>
                <p className="text-white/80 text-sm font-medium">{currentTime.toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="hidden lg:flex items-center gap-3">
              <Card className="px-4 py-2 bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                <div className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">CA Jour</p>
                    <p className="text-xl font-black text-primary">{todayTotal.toFixed(0)}€</p>
                  </div>
                  {totalPercentChange !== 0 && (
                    <div className={`flex items-center gap-1 ${totalPercentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPercentChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="text-sm font-bold">{Math.abs(totalPercentChange).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="px-4 py-2 bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ventes</p>
                    <p className="text-xl font-black text-accent">{todayCount}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenCustomerDisplay}
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Eye className="h-5 w-5" />
              </Button>
              
              <Button
                onClick={async () => {
                  const data = await getTodayReportData();
                  setReportData(data);
                  setReportXDialogOpen(true);
                }}
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <FileText className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Categories + Cart */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left: Categories & Products */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search Bar */}
          <Card className="p-3 bg-white shadow-lg border-2 border-primary/20">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  ref={scanInputRef}
                  placeholder="Scanner ou rechercher un produit..."
                  value={scanInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scanInput.trim()) {
                      handleBarcodeScan(scanInput.trim());
                    }
                  }}
                  className="pl-11 h-12 text-lg border-2 border-primary/30 focus:border-primary"
                />
              </div>
              <Button
                onClick={() => navigate('/camera-scanner')}
                size="lg"
                className="bg-accent hover:bg-accent/90 h-12 px-6"
              >
                <Scan className="h-5 w-5 mr-2" />
                Scanner
              </Button>
            </div>
          </Card>

          {/* Categories Grid */}
          <div className="flex-1 overflow-hidden">
            <CategoryGrid
              categories={categories}
              products={products}
              onProductSelect={handleProductSelect}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {!isDayOpenEffective ? (
              <Button
                onClick={() => setOpenDayDialogOpen(true)}
                size="lg"
                className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-bold"
              >
                <Calendar className="h-5 w-5 mr-2" />
                OUVRIR LA JOURNÉE
              </Button>
            ) : (
              <Button
                onClick={() => setCloseDayDialogOpen(true)}
                size="lg"
                className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <CalendarX className="h-5 w-5 mr-2" />
                CLÔTURER
              </Button>
            )}
            
            <Button
              onClick={() => setRefundDialogOpen(true)}
              variant="outline"
              size="lg"
              className="h-14"
            >
              Remboursement
            </Button>
          </div>
        </div>

        {/* Right: Cart */}
        <Card className="w-[420px] flex flex-col bg-white shadow-xl border-2 border-primary/30 overflow-hidden">
          {/* Cart Header */}
          <div className="bg-gradient-to-r from-accent to-accent/80 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                <h2 className="text-xl font-black">PANIER</h2>
              </div>
              <Badge className="bg-white text-accent font-bold text-lg px-3 py-1">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg">Panier vide</p>
                <p className="text-muted-foreground text-sm">Scannez un produit pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <Card key={index} className="p-3 border-2 hover:border-primary/30 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {(item.custom_price ?? item.product.price).toFixed(2)}€
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRemoveFromCart(index)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleItemAction(index, 'decrease')}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <Button
                            onClick={() => handleItemAction(index, 'increase')}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                        </div>
                        
                        <p className="text-lg font-black text-primary">{item.total.toFixed(2)}€</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart Footer - Totals & Payment */}
          {cart.length > 0 && (
            <div className="border-t-2 border-primary/20 p-4 space-y-3 bg-muted/30">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-semibold">{getTotals().subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA</span>
                  <span className="font-semibold">{getTotals().totalVat.toFixed(2)}€</span>
                </div>
                {getTotals().totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise</span>
                    <span className="font-semibold">-{getTotals().totalDiscount.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t-2 border-primary/30">
                  <span className="text-xl font-black">TOTAL</span>
                  <span className="text-3xl font-black text-primary">{getTotals().total.toFixed(2)}€</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    setDiscountTarget({ type: 'global' });
                    setDiscountDialogOpen(true);
                  }}
                  variant="outline"
                  className="h-12"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Remise
                </Button>
                <Button
                  onClick={handleClearCart}
                  variant="outline"
                  className="h-12 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vider
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleCompletePayment('cash')}
                  size="lg"
                  className="h-16 bg-green-600 hover:bg-green-700 flex flex-col gap-1"
                >
                  <Banknote className="h-6 w-6" />
                  <span className="text-xs font-bold">ESPÈCES</span>
                </Button>
                <Button
                  onClick={() => handleCompletePayment('card')}
                  size="lg"
                  className="h-16 bg-blue-600 hover:bg-blue-700 flex flex-col gap-1"
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-xs font-bold">CARTE</span>
                </Button>
                <Button
                  onClick={() => setMixedPaymentDialogOpen(true)}
                  size="lg"
                  className="h-16 bg-purple-600 hover:bg-purple-700 flex flex-col gap-1"
                >
                  <Split className="h-6 w-6" />
                  <span className="text-xs font-bold">MIXTE</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        cart={cart}
        total={getTotals().total}
        onPaymentComplete={(sale) => {
          setCurrentSale(sale);
          setReceiptDialogOpen(true);
          setCart([]);
          setGlobalDiscount(null);
          setAppliedPromoCode(null);
          setPaymentDialogOpen(false);
        }}
        isInvoiceMode={isInvoiceMode}
        selectedCustomer={selectedCustomer}
      />

      {/* Mixed Payment Dialog */}
      <MixedPaymentDialog
        open={mixedPaymentDialogOpen}
        onOpenChange={setMixedPaymentDialogOpen}
        cart={cart}
        total={getTotals().total}
        onPaymentComplete={(sale) => {
          setCurrentSale(sale);
          setReceiptDialogOpen(true);
          setCart([]);
          setGlobalDiscount(null);
          setAppliedPromoCode(null);
          setMixedPaymentDialogOpen(false);
        }}
      />

      {/* Discount Dialog */}
      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        onApply={handleApplyDiscount}
      />

      {/* Promo Code Dialog */}
      <PromoCodeDialog
        open={promoDialogOpen}
        onOpenChange={setPromoDialogOpen}
        onApply={handleApplyPromo}
      />

      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
          setCustomerDialogOpen(false);
        }}
      />

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm bg-white p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-primary font-bold text-center">TICKET DE CAISSE</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {currentSale && <ThermalReceipt sale={currentSale} />}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => setReceiptDialogOpen(false)}
              className="flex-1"
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                printThermalReceipt();
                setTimeout(() => setReceiptDialogOpen(false), 500);
              }}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              IMPRIMER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pin Lock Dialog */}
      <PinLockDialog
        open={isLocked}
        onUnlock={() => setIsLocked(false)}
      />

      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onRefundComplete={() => {
          setRefundDialogOpen(false);
          toast.success('Remboursement effectué');
        }}
      />

      {/* Remote Scan Dialog */}
      <RemoteScanDialog
        open={!!remoteScanSessionId}
        sessionId={remoteScanSessionId}
        onClose={() => setRemoteScanSessionId(null)}
        onScan={(barcode) => {
          handleBarcodeScan(barcode);
          markItemProcessed.mutate({ sessionId: remoteScanSessionId!, barcode });
        }}
      />

      {/* Physical Scan Action Dialog */}
      <PhysicalScanActionDialog
        open={physicalScanDialogOpen}
        barcode={scannedBarcode}
        product={scannedProduct}
        onClose={() => setPhysicalScanDialogOpen(false)}
        onAddToCart={() => {
          if (scannedProduct) {
            handleProductSelect(scannedProduct);
          }
          setPhysicalScanDialogOpen(false);
        }}
      />

      {/* Open Day Dialog */}
      <OpenDayDialog
        open={openDayDialogOpen}
        onOpenChange={setOpenDayDialogOpen}
        onOpenDay={handleOpenDay}
      />

      {/* Report X Dialog */}
      <ReportXDialog
        open={reportXDialogOpen}
        onOpenChange={setReportXDialogOpen}
        reportData={reportData}
      />

      {/* Close Day Dialog */}
      <CloseDayDialog
        open={closeDayDialogOpen}
        onOpenChange={setCloseDayDialogOpen}
        onCloseDay={handleCloseDay}
        todayReport={todayReport}
      />
    </div>
  );
};

export default Index;
