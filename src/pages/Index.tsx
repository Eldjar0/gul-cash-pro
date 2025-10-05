import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Scan,
  CreditCard,
  Banknote,
  Trash2,
  Euro,
  Clock,
  ShoppingBag,
  Percent,
  Edit,
  Ticket,
  Eye,
  Scale,
  Calendar,
  CalendarX,
  FileText,
  CloudSun,
  Calculator,
  Divide,
  Minus,
  X,
  TrendingUp,
  TrendingDown,
  Save,
  FolderOpen,
  Undo2,
  Split,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createSafeBroadcastChannel } from '@/lib/safeBroadcast';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
  custom_price?: number; // Prix personnalisé pour cette vente
  discount?: {
    type: DiscountType;
    value: number;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Redirection automatique vers /mobile si on est sur APK
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
  
  // Get today's sales for statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { data: todaySales } = useSales(today, tomorrow);
  
  // Get yesterday's sales for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const { data: yesterdaySales } = useSales(yesterday, today);
  
  // Calculate statistics
  const todayTotal = todaySales?.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0) || 0;
  const yesterdayTotal = yesterdaySales?.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0) || 0;
  const todayCount = todaySales?.filter(s => !s.is_cancelled).length || 0;
  const yesterdayCount = yesterdaySales?.filter(s => !s.is_cancelled).length || 0;
  
  const totalPercentChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
  const countPercentChange = yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 : 0;
  
  // Lock system
  const [isLocked, setIsLocked] = useState(false);
  
  // Daily reports hooks
  const { data: todayReport } = useTodayReport();
  const openDay = useOpenDay();
  const closeDay = useCloseDay();
  // UI override so buttons update instantly after actions
  const [isDayOpenLocal, setIsDayOpenLocal] = useState<boolean | null>(null);
  const isDayOpenEffective = isDayOpenLocal ?? !!todayReport;

  // Reset local override when server data changes
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
  
  // Daily reports states
  const [openDayDialogOpen, setOpenDayDialogOpen] = useState(false);
  const [closeDayDialogOpen, setCloseDayDialogOpen] = useState(false);
  const [reportXDialogOpen, setReportXDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // New features states
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [mixedPaymentDialogOpen, setMixedPaymentDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Remote scanning states
  const [remoteScanSessionId, setRemoteScanSessionId] = useState<string | null>(null);
  const markItemProcessed = useMarkItemProcessed();

  // Physical scan action dialog states
  const [physicalScanDialogOpen, setPhysicalScanDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // Calculate totals - defined before useEffect to avoid initialization errors
  const getTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = cart.reduce((sum, item) => sum + item.vatAmount, 0);
    const itemDiscounts = cart.reduce((sum, item) => {
      if (item.discount) {
        const discountAmount =
          item.discount.type === 'percentage'
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

  // Synchroniser l'affichage client avec le panier
  useEffect(() => {
    const updateCustomerDisplay = () => {
      const totals = getTotals();
      const displayItems = cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.custom_price ?? item.product.price,
        originalPrice: item.product.price,
        vatRate: item.product.vat_rate,
        total: item.total,
        unit: item.product.unit,
        discount: item.discount ? {
          type: item.discount.type,
          value: item.discount.value,
        } : undefined,
        hasCustomPrice: item.custom_price !== undefined && item.custom_price !== item.product.price,
      }));

      const state = {
        items: displayItems,
        status: cart.length > 0 ? 'shopping' : 'idle',
        timestamp: Date.now(),
        cashierName: user?.email?.split('@')[0] || 'Caisse',
        saleNumber: 'EN COURS',
        globalDiscount: globalDiscount ? {
          type: globalDiscount.type,
          value: globalDiscount.value,
        } : undefined,
        promoCode: appliedPromoCode ? {
          code: appliedPromoCode.code,
          type: appliedPromoCode.type,
          value: appliedPromoCode.value,
        } : undefined,
        totals: {
          subtotal: totals.subtotal,
          totalVat: totals.totalVat,
          totalDiscount: totals.totalDiscount,
          total: totals.total,
        },
        isInvoice: isInvoiceMode,
        customer: selectedCustomer ? {
          name: selectedCustomer.name,
        } : undefined,
      };

      console.log('[POS] Sending to customer display:', state);

      // Envoyer via BroadcastChannel
      try {
        displayChannel.postMessage(state);
      } catch (e) {
        console.error('[POS] BroadcastChannel error:', e);
      }
      
      // Sauvegarder dans localStorage pour persistance
      localStorage.setItem('customer_display_state', JSON.stringify(state));
    };

    updateCustomerDisplay();
  }, [cart, displayChannel, globalDiscount, appliedPromoCode, isInvoiceMode, selectedCustomer]);

  // Traiter les items scannés à distance
  useRealtimeScannedItems(remoteScanSessionId ?? undefined, (newItem) => {
    console.log('New remote scanned item:', newItem);
    
    // Find product by barcode
    const product = products?.find(p => p.barcode === newItem.barcode);
    if (product) {
      handleProductSelect(product, newItem.quantity);
      toast.success(`Produit ajouté: ${product.name}`);
      // Mark item as processed
      markItemProcessed.mutate(newItem.id);
    } else {
      toast.error(`Produit non trouvé: ${newItem.barcode}`);
      // Still mark as processed to avoid retry
      markItemProcessed.mutate(newItem.id);
    }
  });

  // Ouvrir l'affichage client dans une nouvelle fenêtre
  const openCustomerDisplay = () => {
    const width = window.screen.width;
    const height = window.screen.height;
    
    // Ouvrir en plein écran sur l'écran secondaire si disponible
    const newWindow = window.open(
      '/customer-display',
      'customerDisplay',
      `width=${width},height=${height},left=${width},top=0,fullscreen=yes`
    );
    
    if (newWindow) {
      setCustomerDisplayWindow(newWindow);
      toast.success('Affichage client ouvert');
    } else {
      toast.error('Impossible d\'ouvrir l\'affichage client');
    }
  };

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      displayChannel.close();
    };
  }, [displayChannel]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Désactivation de l'auto-focus sur la barre de recherche pour éviter que les scans
  // écrivent des caractères visibles dans le champ
  useEffect(() => {
    // Intentionnellement vide
  }, []);

  // Recherche manuelle uniquement (désactivé auto-search)
  useEffect(() => {
    const term = scanInput.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    // Recherche en direct (debounce 200ms)
    const id = setTimeout(() => {
      handleSearch();
    }, 200);
    return () => clearTimeout(id);
  }, [scanInput, products, categories]);

  // Normalisation AZERTY → chiffres pour les codes-barres
  const normalizeBarcode = (raw: string): string => {
    const azertyMap: Record<string, string> = {
      '&': '1', '!': '1', 'é': '2', '@': '2', '\"': '3', '#': '3', 
      '\'': '4', '$': '4', '(': '5', '%': '5', '-': '6', '^': '6',
      'è': '7', '_': '8', '*': '8', 'ç': '9', 
      'à': '0', ')': '0', '§': '6'
    };
    // Mapper les caractères AZERTY puis garder uniquement les chiffres
    const normalized = raw.split('').map(c => azertyMap[c] ?? c).join('');
    return normalized.replace(/\D+/g, ''); // Supprimer tout ce qui n'est pas un chiffre
  };

  // Calcul du total d'un article avec TVA TTC
  const calculateItemTotal = (product: Product, quantity: number, discount?: CartItem['discount'], customPrice?: number) => {
    const unitPriceTTC = customPrice ?? product.price;
    
    // Prix TTC → HT : diviser par (1 + taux_TVA/100)
    const unitPriceHT = unitPriceTTC / (1 + product.vat_rate / 100);
    const subtotal = unitPriceHT * quantity;
    const vatAmount = subtotal * (product.vat_rate / 100);
    
    let discountAmount = 0;
    if (discount) {
      const totalTTC = unitPriceTTC * quantity;
      discountAmount = discount.type === 'percentage' 
        ? (totalTTC * discount.value) / 100 
        : discount.value;
    }
    
    const total = (unitPriceTTC * quantity) - discountAmount;
    
    return { subtotal, vatAmount, total };
  };

  // Gestion de la sélection de produit - MUST BE BEFORE handleBarcodeScan
  const handleProductSelect = (product: Product, quantity?: number) => {
    const qty = quantity || parseFloat(quantityInput) || 1;
    
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex !== -1) {
        const newCart = [...prevCart];
        const existingItem = newCart[existingItemIndex];
        const newQuantity = existingItem.quantity + qty;
        const totals = calculateItemTotal(product, newQuantity, existingItem.discount, existingItem.custom_price);
        
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          ...totals
        };
        
        return newCart;
      } else {
        const totals = calculateItemTotal(product, qty);
        
        const newItem: CartItem = {
          product,
          quantity: qty,
          ...totals
        };
        
        return [...prevCart, newItem];
      }
    });
    
    setQuantityInput('1');
    setScanInput('');
    setSearchResults([]);
    toast.success(`${product.name} ajouté au panier`);
  };

  // Traitement d'un scan physique - ouvre le dialog d'actions
  const handlePhysicalScan = (raw: string) => {
    const normalized = normalizeBarcode(raw.trim());
    const normalizedDigits = normalized.replace(/\D+/g, '');
    
    if (!normalized || normalized.length < 3) return;

    // Recherche du produit
    let found = products?.find(
      (p) => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase()
    );

    if (!found && normalizedDigits.length >= 3) {
      found = products?.find(
        (p) => p.barcode && p.barcode.replace(/\D+/g, '') === normalizedDigits
      );
    }

    const barcodeToUse = normalizedDigits.length >= 3 ? normalizedDigits : normalized;
    
    // Ouvrir le dialog avec le résultat
    setScannedBarcode(barcodeToUse);
    setScannedProduct(found || null);
    setPhysicalScanDialogOpen(true);
  };

  // Traitement du code-barres scanné (utilisé pour les scans manuels)
  const handleBarcodeScan = (raw: string) => {
    const DEBUG_SCAN = false; // Mettre à true pour debug
    
    const normalized = normalizeBarcode(raw.trim());
    const normalizedDigits = normalized.replace(/\D+/g, ''); // Fallback: chiffres uniquement
    
    if (DEBUG_SCAN) {
      console.log('[SCAN] Raw:', raw, '| Normalized:', normalized, '| Digits:', normalizedDigits);
    }
    
    if (!normalized || normalized.length < 3) return;

    // 1. Recherche exacte sur le code-barres normalisé
    let found = products?.find(
      (p) => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase()
    );

    // 2. Recherche sur chiffres uniquement (fallback)
    if (!found && normalizedDigits.length >= 3) {
      found = products?.find(
        (p) => p.barcode && p.barcode.replace(/\D+/g, '') === normalizedDigits
      );
    }

    if (found) {
      handleProductSelect(found);
      toast.success(`${found.name} ajouté`);
      if (DEBUG_SCAN) {
        console.log('[SCAN] Product found:', found.name, found.barcode);
      }
    } else {
      toast.error('Produit non trouvé');
      if (DEBUG_SCAN) {
        console.warn('[SCAN] Product not found for:', normalized, normalizedDigits);
      }
    }
  };

  // Fonction de recherche (externaliser pour pouvoir être appelée)
  const handleSearch = () => {
    const q = scanInput.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const results = products?.filter((p) => {
      const catName = categories?.find((c) => c.id === p.category_id)?.name?.toLowerCase() || '';
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        catName.includes(q)
      );
    });

    setSearchResults(results?.slice(0, 10) || []);
  };

  const handleQuantityChange = (value: string) => {
    setQuantityInput(value);
  };

  const handleCalculator = (input: string) => {
    if (calcMode === 'input') {
      // Mode input direct
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
        setCalcMode('math');
      } else {
        // Chiffres
        if (waitingForOperand) {
          setCurrentValue(parseFloat(input));
          setWaitingForOperand(false);
        } else {
          const newValue = currentValue !== null ? parseFloat('' + currentValue + input) : parseFloat(input);
          setCurrentValue(newValue);
        }
      }
    } else {
      // Mode math evaluation
      try {
        // eslint-disable-next-line no-eval
        const result = eval(input);
        setCurrentValue(result);
        setCalcMode('input');
        setOperation(null);
        setWaitingForOperand(false);
      } catch {
        toast.error('Expression invalide');
      }
    }
  };

  const handleItemAction = (index: number, action: 'increase' | 'decrease' | 'edit') => {
    const newCart = [...cart];
    if (action === 'increase') {
      newCart[index].quantity += 1;
    } else if (action === 'decrease' && newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
    }
    const totals = calculateItemTotal(
      newCart[index].product,
      newCart[index].quantity,
      newCart[index].discount,
      newCart[index].custom_price
    );
    newCart[index] = { ...newCart[index], ...totals };
    setCart(newCart);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyDiscount = (type: DiscountType, value: number) => {
    if (discountTarget?.type === 'item' && discountTarget.index !== undefined) {
      const newCart = [...cart];
      newCart[discountTarget.index].discount = { type, value };
      const totals = calculateItemTotal(
        newCart[discountTarget.index].product,
        newCart[discountTarget.index].quantity,
        { type, value },
        newCart[discountTarget.index].custom_price
      );
      newCart[discountTarget.index] = { ...newCart[discountTarget.index], ...totals };
      setCart(newCart);
    } else if (discountTarget?.type === 'global') {
      setGlobalDiscount({ type, value });
    }
    setDiscountDialogOpen(false);
    setDiscountTarget(null);
  };

  const handleApplyPromo = (code: string, type: 'percentage' | 'amount', value: number) => {
    setAppliedPromoCode({ code, type, value });
    setPromoDialogOpen(false);
    toast.success(`Code promo "${code}" appliqué`);
  };

  const handleOpenCustomerDisplay = () => {
    openCustomerDisplay();
  };

  const handleCompletePayment = (paymentType: 'cash' | 'card' | 'mobile' | 'mixed') => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    if (paymentType === 'mixed') {
      setMixedPaymentDialogOpen(true);
    } else {
      setPaymentDialogOpen(true);
    }
  };

  const handleOpenDay = (amount: number) => {
    openDay.mutate(amount, {
      onSuccess: () => {
        setIsDayOpenLocal(true);
        setOpenDayDialogOpen(false);
        toast.success('Journée ouverte');
      }
    });
  };

  const handleReportX = async () => {
    const data = await getTodayReportData();
    setReportData(data);
    setReportXDialogOpen(true);
  };

  const handleCloseDay = (closingAmount: number) => {
    if (!todayReport) return;
    
    closeDay.mutate(
      { 
        reportId: todayReport.id, 
        closingAmount,
        reportData: reportData!
      },
      {
        onSuccess: () => {
          setIsDayOpenLocal(false);
          setCloseDayDialogOpen(false);
          toast.success('Journée clôturée');
        }
      }
    );
  };

  const handleClearCart = () => {
    setCart([]);
    setGlobalDiscount(null);
    setAppliedPromoCode(null);
    setSelectedCustomer(null);
    setIsInvoiceMode(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-primary via-primary-glow to-primary border-b-2 border-primary/20 shadow-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoMarket} alt="Logo" className="h-12 w-12 rounded-lg shadow-lg" />
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">CAISSE</h1>
                <p className="text-white/80 text-sm">{currentTime.toLocaleTimeString('fr-FR')}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden lg:flex items-center gap-3">
              <Card className="px-4 py-2 bg-white/95 border-0 shadow-lg">
                <div className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">CA Jour</p>
                    <p className="text-xl font-black text-primary">{todayTotal.toFixed(0)}€</p>
                  </div>
                  {totalPercentChange !== 0 && (
                    <div className={`flex items-center ${totalPercentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPercentChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="text-sm font-bold ml-1">{Math.abs(totalPercentChange).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="px-4 py-2 bg-white/95 border-0 shadow-lg">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ventes</p>
                    <p className="text-xl font-black text-accent">{todayCount}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions */}
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
                onClick={handleReportX}
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

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search */}
          <Card className="p-3 bg-white shadow-lg border-2 border-primary/20">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  ref={scanInputRef}
                  placeholder="Scanner ou rechercher..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeScan(scanInput);
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

          {/* Category Grid */}
          <div className="flex-1 overflow-hidden">
            <CategoryGrid
              onProductSelect={handleProductSelect}
            />
          </div>

          {/* Day Actions */}
          <div className="flex gap-2">
            {!isDayOpenEffective ? (
              <Button
                onClick={() => setOpenDayDialogOpen(true)}
                size="lg"
                className="flex-1 h-14 bg-green-600 hover:bg-green-700"
              >
                <Calendar className="h-5 w-5 mr-2" />
                OUVRIR LA JOURNÉE
              </Button>
            ) : (
              <Button
                onClick={() => setCloseDayDialogOpen(true)}
                size="lg"
                className="flex-1 h-14 bg-red-600 hover:bg-red-700"
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
        <Card className="w-[420px] flex flex-col bg-white shadow-xl border-2 border-primary/30">
          <div className="bg-gradient-to-r from-accent to-accent/80 p-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                PANIER
              </h2>
              <div className="bg-white text-accent font-bold text-lg px-3 py-1 rounded-lg">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <Card key={index} className="p-3 border-2 hover:border-primary/30">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {(item.custom_price ?? item.product.price).toFixed(2)}€
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRemoveFromCart(index)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
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

          {cart.length > 0 && (
            <div className="border-t-2 p-4 space-y-3 bg-muted/30">
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
                <div className="flex justify-between pt-2 border-t-2">
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
                  className="h-12 text-destructive"
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
                  onClick={() => handleCompletePayment('mixed')}
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

      {/* Dialogs */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onComplete={(sale) => {
          setCurrentSale(sale);
          setReceiptDialogOpen(true);
          handleClearCart();
        }}
      />

      <MixedPaymentDialog
        open={mixedPaymentDialogOpen}
        onOpenChange={setMixedPaymentDialogOpen}
        onComplete={(sale) => {
          setCurrentSale(sale);
          setReceiptDialogOpen(true);
          handleClearCart();
        }}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        onApply={handleApplyDiscount}
      />

      <PromoCodeDialog
        open={promoDialogOpen}
        onOpenChange={setPromoDialogOpen}
        onApply={handleApplyPromo}
      />

      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setCustomerDialogOpen(false);
        }}
      />

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-center">TICKET DE CAISSE</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {currentSale && <ThermalReceipt sale={currentSale} />}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)} className="flex-1">
              Fermer
            </Button>
            <Button
              onClick={() => {
                printThermalReceipt();
                setTimeout(() => setReceiptDialogOpen(false), 500);
              }}
              className="flex-1 bg-accent"
            >
              IMPRIMER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PinLockDialog open={isLocked} onUnlock={() => setIsLocked(false)} />

      <RefundDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} />

      <RemoteScanDialog
        isOpen={!!remoteScanSessionId}
        sessionId={remoteScanSessionId || ''}
        onClose={() => setRemoteScanSessionId(null)}
      />

      <PhysicalScanActionDialog
        open={physicalScanDialogOpen}
        onOpenChange={setPhysicalScanDialogOpen}
        barcode={scannedBarcode}
        product={scannedProduct}
        onAddToCart={() => {
          if (scannedProduct) {
            handleProductSelect(scannedProduct);
          }
          setPhysicalScanDialogOpen(false);
        }}
      />

      <OpenDayDialog
        open={openDayDialogOpen}
        onOpenChange={setOpenDayDialogOpen}
        onConfirm={handleOpenDay}
      />

      <ReportXDialog
        open={reportXDialogOpen}
        onOpenChange={setReportXDialogOpen}
        reportData={reportData}
        todayReport={todayReport}
      />

      <CloseDayDialog
        open={closeDayDialogOpen}
        onOpenChange={setCloseDayDialogOpen}
        onConfirm={handleCloseDay}
        todayReport={todayReport!}
      />
    </div>
  );
};

export default Index;
