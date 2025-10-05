import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scan, CreditCard, Banknote, Trash2, Euro, Clock, ShoppingBag, Percent, Edit, Ticket, Eye, Scale, Calendar, CalendarX, FileText, CloudSun, Calculator, Divide, Minus, X, TrendingUp, TrendingDown, Save, FolderOpen, Undo2, Split, UserCog, ReceiptText, ChevronRight, AlertCircle, Smartphone, User, CheckCircle } from 'lucide-react';
import logoMarket from '@/assets/logo-market.png';
import { CategoryGrid } from '@/components/pos/CategoryGrid';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { MixedPaymentDialog } from '@/components/pos/MixedPaymentDialog';
import { DiscountDialog } from '@/components/pos/DiscountDialog';
import { PromoCodeDialog } from '@/components/pos/PromoCodeDialog';
import { CustomerDialog } from '@/components/pos/CustomerDialog';
import { CustomerCreditDialog } from '@/components/pos/CustomerCreditDialog';
import { CustomerCreditManagementDialog } from '@/components/customers/CustomerCreditManagementDialog';
import { Receipt } from '@/components/pos/Receipt';
import { PinLockDialog } from '@/components/pos/PinLockDialog';
import { SavedCartsDialog } from '@/components/pos/SavedCartsDialog';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { PhysicalScanActionDialog } from '@/components/pos/PhysicalScanActionDialog';
import { ThermalReceipt, printThermalReceipt } from '@/components/pos/ThermalReceipt';
import { OpenDayDialog } from '@/components/pos/OpenDayDialog';
import { ReportXDialog } from '@/components/pos/ReportXDialog';
import { CloseDayDialog } from '@/components/pos/CloseDayDialog';
import { Product, useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSale, useSales } from '@/hooks/useSales';
import { useCategories } from '@/hooks/useCategories';
import { Customer, useCustomers } from '@/hooks/useCustomers';
import { useCustomerCredit, useChargeCredit } from '@/hooks/useCustomerCredit';
import { useTodayReport, useOpenDay, useCloseDay, getTodayReportData, ReportData } from '@/hooks/useDailyReports';
import { useWeather } from '@/hooks/useWeather';
import { useActivePromotions, calculateDiscount } from '@/hooks/usePromotions';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  is_gift?: boolean; // Article offert
  subtotal: number;
  vatAmount: number;
  total: number;
}
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading
  } = useAuth();

  // Redirection automatique vers /mobile si on est sur APK
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate('/mobile', {
        replace: true
      });
    }
  }, [navigate]);
  const {
    data: products
  } = useProducts();
  const {
    data: categories
  } = useCategories();
  const createSale = useCreateSale();
  const scanInputRef = useRef<HTMLInputElement>(null);
  const {
    temperature,
    loading: weatherLoading
  } = useWeather();
  
  // Promotions automatiques
  const { data: activePromotions } = useActivePromotions();
  const [appliedAutoPromotion, setAppliedAutoPromotion] = useState<any>(null);

  // Get today's sales for statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const {
    data: todaySales
  } = useSales(today, tomorrow);

  // Get yesterday's sales for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const {
    data: yesterdaySales
  } = useSales(yesterday, today);

  // Calculate statistics
  const todayTotal = todaySales?.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0) || 0;
  const yesterdayTotal = yesterdaySales?.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0) || 0;
  const todayCount = todaySales?.filter(s => !s.is_cancelled).length || 0;
  const yesterdayCount = yesterdaySales?.filter(s => !s.is_cancelled).length || 0;
  const totalPercentChange = yesterdayTotal > 0 ? (todayTotal - yesterdayTotal) / yesterdayTotal * 100 : 0;
  const countPercentChange = yesterdayCount > 0 ? (todayCount - yesterdayCount) / yesterdayCount * 100 : 0;

  // Lock system
  const [isLocked, setIsLocked] = useState(false);

  // Daily reports hooks
  const {
    data: todayReport
  } = useTodayReport();
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
  const [globalDiscount, setGlobalDiscount] = useState<{
    type: DiscountType;
    value: number;
  } | null>(null);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<{
    type: 'item' | 'global';
    index?: number;
  } | null>(null);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string;
    type: 'percentage' | 'amount';
    value: number;
  } | null>(null);
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
  const [savedCartsDialogOpen, setSavedCartsDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [mixedPaymentDialogOpen, setMixedPaymentDialogOpen] = useState(false);
  const [customerCreditDialogOpen, setCustomerCreditDialogOpen] = useState(false);
  const [cancelCartDialogOpen, setCancelCartDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectCustomerDialogOpen, setSelectCustomerDialogOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [creditManagementDialogOpen, setCreditManagementDialogOpen] = useState(false);
  const [creditManagementCustomer, setCreditManagementCustomer] = useState<{ id: string; name: string } | null>(null);
  
  // Fetch customers
  const { data: customers } = useCustomers();
  const { data: creditAccounts } = useCustomerCredit();
  const chargeCredit = useChargeCredit();
  
  // Filter customers based on search term
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Physical scan action dialog states
  const [physicalScanDialogOpen, setPhysicalScanDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // Calculer les promotions automatiques quand le panier change
  useEffect(() => {
    if (activePromotions && cart.length > 0) {
      const customerType = selectedCustomer ? 'professional' : null;
      const cartForPromo = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.custom_price ?? item.product.price,
        total: item.total
      }));
      
      const promoResult = calculateDiscount(cartForPromo, activePromotions, customerType);
      if (promoResult.discount > 0) {
        setAppliedAutoPromotion(promoResult.appliedPromo);
      } else {
        setAppliedAutoPromotion(null);
      }
    } else {
      setAppliedAutoPromotion(null);
    }
  }, [cart, activePromotions, selectedCustomer]);

  // Calculate totals - defined before useEffect to avoid initialization errors
  const getTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = cart.reduce((sum, item) => sum + item.vatAmount, 0);
    const itemDiscounts = cart.reduce((sum, item) => {
      if (item.discount) {
        const discountAmount = item.discount.type === 'percentage' ? item.subtotal * item.discount.value / 100 : item.discount.value;
        return sum + discountAmount;
      }
      return sum;
    }, 0);
    let total = cart.reduce((sum, item) => sum + item.total, 0);
    let globalDiscountAmount = 0;
    let promoCodeAmount = 0;
    let autoPromotionAmount = 0;
    
    if (globalDiscount) {
      globalDiscountAmount = globalDiscount.type === 'percentage' ? total * globalDiscount.value / 100 : globalDiscount.value;
      total -= globalDiscountAmount;
    }
    if (appliedPromoCode) {
      promoCodeAmount = appliedPromoCode.type === 'percentage' ? total * appliedPromoCode.value / 100 : appliedPromoCode.value;
      total -= promoCodeAmount;
    }
    
    // Appliquer les promotions automatiques
    if (appliedAutoPromotion && cart.length > 0) {
      const customerType = selectedCustomer ? 'professional' : null;
      const cartForPromo = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.custom_price ?? item.product.price,
        total: item.total
      }));
      
      const promoResult = calculateDiscount(cartForPromo, [appliedAutoPromotion], customerType);
      autoPromotionAmount = promoResult.discount;
      total -= autoPromotionAmount;
    }
    
    const totalDiscount = itemDiscounts + globalDiscountAmount + promoCodeAmount + autoPromotionAmount;
    return {
      subtotal,
      totalVat,
      totalDiscount,
      total: Math.max(0, total),
      autoPromotionAmount
    };
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
          value: item.discount.value
        } : undefined,
        hasCustomPrice: item.custom_price !== undefined && item.custom_price !== item.product.price
      }));
      const state = {
        items: displayItems,
        status: cart.length > 0 ? 'shopping' : 'idle',
        timestamp: Date.now(),
        cashierName: user?.email?.split('@')[0] || 'Caisse',
        saleNumber: 'EN COURS',
        globalDiscount: globalDiscount ? {
          type: globalDiscount.type,
          value: globalDiscount.value
        } : undefined,
        promoCode: appliedPromoCode ? {
          code: appliedPromoCode.code,
          type: appliedPromoCode.type,
          value: appliedPromoCode.value
        } : undefined,
        totals: {
          subtotal: totals.subtotal,
          totalVat: totals.totalVat,
          totalDiscount: totals.totalDiscount,
          total: totals.total
        },
        isInvoice: isInvoiceMode,
        customer: selectedCustomer ? {
          name: selectedCustomer.name
        } : undefined
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

  // Ouvrir l'affichage client dans une nouvelle fenêtre
  const openCustomerDisplay = () => {
    const width = window.screen.width;
    const height = window.screen.height;

    // Ouvrir en plein écran sur l'écran secondaire si disponible
    const newWindow = window.open('/customer-display', 'customerDisplay', `width=${width},height=${height},left=${width},top=0,fullscreen=yes`);
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
      '&': '1',
      '!': '1',
      'é': '2',
      '@': '2',
      '"': '3',
      '#': '3',
      "'": '4',
      '$': '4',
      '(': '5',
      '%': '5',
      '-': '6',
      '^': '6',
      'è': '7',
      '_': '8',
      '*': '8',
      'ç': '9',
      'à': '0',
      ')': '0',
      '§': '6'
    };
    // Mapper les caractères AZERTY puis garder uniquement les chiffres
    const normalized = raw.split('').map(c => azertyMap[c] ?? c).join('');
    return normalized.replace(/\D+/g, ''); // Supprimer tout ce qui n'est pas un chiffre
  };

  // Calcul du total d'un article avec TVA TTC
  const calculateItemTotal = (product: Product, quantity: number, discount?: CartItem['discount'], customPrice?: number, isGift?: boolean) => {
    const unitPriceTTC = customPrice ?? product.price;

    // Prix TTC → HT : diviser par (1 + taux_TVA/100)
    const unitPriceHT = unitPriceTTC / (1 + product.vat_rate / 100);
    const subtotal = unitPriceHT * quantity;
    const vatAmount = subtotal * (product.vat_rate / 100);
    let discountAmount = 0;
    if (discount) {
      const totalTTC = unitPriceTTC * quantity;
      discountAmount = discount.type === 'percentage' ? totalTTC * discount.value / 100 : discount.value;
    }
    
    // Si c'est un cadeau, le total est 0
    const total = isGift ? 0 : (unitPriceTTC * quantity - discountAmount);
    
    return {
      subtotal: isGift ? 0 : subtotal,
      vatAmount: isGift ? 0 : vatAmount,
      total
    };
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

  // Traitement d'un scan physique - ajoute direct au panier si trouvé
  const handlePhysicalScan = (raw: string) => {
    const normalized = normalizeBarcode(raw.trim());
    const normalizedDigits = normalized.replace(/\D+/g, '');
    if (!normalized || normalized.length < 3) return;

    // Recherche du produit
    let found = products?.find(p => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase());
    if (!found && normalizedDigits.length >= 3) {
      found = products?.find(p => p.barcode && p.barcode.replace(/\D+/g, '') === normalizedDigits);
    }
    const barcodeToUse = normalizedDigits.length >= 3 ? normalizedDigits : normalized;

    // Si produit trouvé, ajouter direct au panier
    if (found) {
      handleProductSelect(found);
    } else {
      // Si pas trouvé, ouvrir le dialog pour créer
      setScannedBarcode(barcodeToUse);
      setScannedProduct(null);
      setPhysicalScanDialogOpen(true);
    }
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
    let found = products?.find(p => p.barcode && normalizeBarcode(p.barcode).toLowerCase() === normalized.toLowerCase());

    // 2. Recherche sur chiffres uniquement (fallback)
    if (!found && normalizedDigits.length >= 3) {
      found = products?.find(p => p.barcode && p.barcode.replace(/\D+/g, '') === normalizedDigits);
    }
    if (found) {
      if (DEBUG_SCAN) console.log('[SCAN] Product found:', found.name);
      handleProductSelect(found);
      setScanInput("");
      setSearchResults([]);
      return;
    }

    // Si inconnu, afficher un toast avec action pour créer
    const barcodeToUse = normalizedDigits.length >= 3 ? normalizedDigits : normalized;
    if (DEBUG_SCAN) console.log('[SCAN] Unknown barcode:', barcodeToUse);
    toast.error('Code-barres inconnu', {
      description: `Aucun produit lié à ${barcodeToUse}`,
      action: {
        label: 'Créer produit',
        onClick: () => navigate(`/products?new=1&barcode=${encodeURIComponent(barcodeToUse)}`)
      }
    });
    setScanInput("");
  };

  // Détection ultra-robuste des scans de lecteur code-barres (HID)
  useEffect(() => {
    const DEBUG_SCAN = true; // ACTIVÉ pour debug
    let buffer = "";
    let lastKeyTime = 0;
    let isScanning = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let scanStartTime = 0;
    const isEditableField = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;

      // Si un dialogue est ouvert, ignorer TOUS les scans
      const hasOpenDialog = document.querySelector('[role="dialog"]') !== null;
      if (hasOpenDialog) return true;

      // Vérifier si l'élément ou un parent a l'attribut data-scan-ignore
      let element: HTMLElement | null = target;
      while (element) {
        if (element.hasAttribute('data-scan-ignore')) {
          return true;
        }
        element = element.parentElement;
      }
      const tagName = target.tagName.toLowerCase();
      const isContentEditable = target.isContentEditable;
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      return isInput || isContentEditable;
    };

    // Convertit un événement clavier en chiffre fiable, indépendamment du layout (AZERTY/Numpad)
    const mapEventToDigit = (e: KeyboardEvent): string | null => {
      const code = e.code;

      // 1) Rangée de chiffres physique (Digit0..Digit9) - PRIORITÉ ABSOLUE
      if (code && code.startsWith('Digit')) {
        const d = code.replace('Digit', '');
        return /^[0-9]$/.test(d) ? d : null;
      }

      // 2) Pavé numérique (Numpad0..Numpad9)
      if (code && code.startsWith('Numpad')) {
        const d = code.replace('Numpad', '');
        return /^[0-9]$/.test(d) ? d : null;
      }

      // 3) UNIQUEMENT si code n'est pas disponible (très rare)
      if (!code && /^[0-9]$/.test(e.key)) {
        return e.key;
      }
      return null;
    };
    const processScan = () => {
      if (buffer.length >= 3) {
        const duration = Date.now() - scanStartTime;
        console.log('[SCAN] 🔍 Processing:', buffer, `(${duration}ms, ${buffer.length} chars)`);
        handlePhysicalScan(buffer);
      }
      buffer = "";
      isScanning = false;
      scanStartTime = 0;
    };
    const handler = (e: KeyboardEvent) => {
      // Ignorer si fenêtre inactive
      if (document.hidden) return;
      const now = Date.now();
      const delta = now - lastKeyTime;
      lastKeyTime = now;

      // Touches de finalisation envoyées par certains lecteurs
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'NumpadEnter') {
        if (isScanning && buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutId) clearTimeout(timeoutId);
          processScan();
        }
        return;
      }

      // On ne s'intéresse qu'aux touches imprimables pour les chiffres
      if (e.key.length === 1) {
        // Pas de reset en cours de scan; on laisse le timeout finaliser
        if (!isScanning && delta > 400 && buffer.length > 0) {
          if (DEBUG_SCAN) console.log('[SCAN] Reset: delta trop grand hors scan', delta);
          buffer = "";
          isScanning = false;
          scanStartTime = 0;
        }
        const digit = mapEventToDigit(e);

        // Première touche: démarrer le scan SI PAS dans un champ éditable
        if (buffer.length === 0) {
          if (isEditableField(e.target)) {
            // Laisser l'utilisateur taper normalement dans les champs
            return;
          }
          // Démarre un scan uniquement si on reçoit bien un chiffre
          if (digit !== null) {
            scanStartTime = now;
            isScanning = true;
            e.preventDefault();
            e.stopPropagation();
            console.log('[SCAN] 🚀 Start detected, code:', e.code, '→ digit:', digit);
            buffer += digit;
          } else {
            // Pas un chiffre → ignorer
            return;
          }
        } else {
          // Déjà en cours de scan
          if (digit !== null) {
            // Deuxième touche: si < 50ms, on confirme le scan
            if (buffer.length === 1 && delta < 50) {
              isScanning = true;
              console.log('[SCAN] ✓ Confirmed (fast typing)');
            }
            console.log('[SCAN] 📥 Adding digit:', digit, 'from code:', e.code);
            buffer += digit;
            // Empêcher toute écriture à l'écran pendant le scan
            e.preventDefault();
            e.stopPropagation();
          } else {
            // Non chiffre au milieu d'un scan → ignorer mais ne pas casser le flux
            e.preventDefault();
            e.stopPropagation();
          }
        }

        // Timeout: finaliser si pas de nouvelle touche après 500ms
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (buffer.length >= 8) {
            console.log('[SCAN] ⏱️ Auto-finalize (timeout)');
            processScan();
          } else if (buffer.length > 0) {
            // Trop court, probablement pas un scan
            console.log('[SCAN] ❌ Reset: trop court', buffer);
            buffer = "";
            isScanning = false;
            scanStartTime = 0;
          }
        }, 500);
      }
    };

    // Utiliser seulement keydown pour éviter les doublons (keypress est obsolète)
    window.addEventListener('keydown', handler, {
      capture: true
    });
    return () => {
      window.removeEventListener('keydown', handler, {
        capture: true
      } as any);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [products]);
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-pos-display">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-success mx-auto mb-4"></div>
          <p className="text-white font-medium">Chargement...</p>
        </div>
      </div>;
  }
  const handleSearch = () => {
    if (!scanInput.trim() || !products) {
      setSearchResults([]);
      return;
    }
    const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const normalizedInput = normalizeBarcode(scanInput);
    const searchTerm = strip(scanInput);
    const trimmedSearch = scanInput.trim();
    const hasDigits = normalizedInput.length > 0;

    // Détection du type de recherche
    const isNumber = !isNaN(Number(trimmedSearch)) && trimmedSearch !== '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedSearch);

    // Recherche exacte par code-barres normalisé d'abord
    const exactBarcode = products.find(p => p.barcode && normalizeBarcode(p.barcode) === normalizedInput);
    if (exactBarcode) {
      // Ajout direct au panier
      handleProductSelect(exactBarcode);
      return;
    }

    // Si pas de correspondance exacte, recherche générale multi-critères
    let results = products.filter(p => {
      const normalizedBarcode = p.barcode ? normalizeBarcode(p.barcode) : '';
      const name = strip(p.name);
      const desc = p.description ? strip(p.description) : '';
      const idStr = strip(p.id);

      // Recherche de base (nom, code-barres, description)
      let matches = hasDigits && normalizedBarcode.includes(normalizedInput) || p.barcode && strip(p.barcode).includes(searchTerm) || name.includes(searchTerm) || idStr.includes(searchTerm) || desc.includes(searchTerm);

      // Recherche par prix si c'est un nombre
      if (isNumber && !matches) {
        const numValue = Number(trimmedSearch);
        matches = Math.abs(p.price - numValue) < 0.01; // Comparaison avec tolérance
      }

      // Recherche par UUID si c'est un UUID
      if (isUUID && !matches) {
        matches = p.id === trimmedSearch;
      }
      return matches;
    });

    // Recherche par catégorie (accent-insensible)
    if (categories && categories.length > 0) {
      const matchingCategories = categories.filter(cat => strip(cat.name).includes(searchTerm));
      if (matchingCategories.length > 0) {
        const categoryIds = matchingCategories.map(cat => cat.id);
        const productsByCategory = products.filter(p => p.category_id && categoryIds.includes(p.category_id));
        results = [...results, ...productsByCategory].filter((product, index, self) => self.findIndex(p => p.id === product.id) === index);
      }
    }
    setSearchResults(results);
  };
  const handleProductLinked = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      handleProductSelect(product);
    }
  };
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  const handleSelectSearchResult = (product: Product) => {
    handleProductSelect(product);
    setScanInput('');
    setSearchResults([]);
  };
  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.info('Article retiré');
  };
  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const {
      subtotal,
      vatAmount,
      total
    } = calculateItemTotal(item.product, quantity, item.discount, item.custom_price, item.is_gift);
    newCart[index] = {
      ...item,
      quantity,
      subtotal,
      vatAmount,
      total
    };
    setCart(newCart);
  };
  const handleUpdatePrice = (index: number, newPrice: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const {
      subtotal,
      vatAmount,
      total
    } = calculateItemTotal(item.product, item.quantity, item.discount, newPrice, item.is_gift);
    newCart[index] = {
      ...item,
      custom_price: newPrice,
      subtotal,
      vatAmount,
      total
    };
    setCart(newCart);
    toast.success('Prix modifié');
  };
  
  const handleToggleGift = (index: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newIsGift = !item.is_gift;
    const {
      subtotal,
      vatAmount,
      total
    } = calculateItemTotal(item.product, item.quantity, item.discount, item.custom_price, newIsGift);
    newCart[index] = {
      ...item,
      is_gift: newIsGift,
      subtotal,
      vatAmount,
      total
    };
    setCart(newCart);
    toast.success(newIsGift ? 'Article offert' : 'Cadeau annulé');
  };
  const handleConfirmPayment = async (method: 'cash' | 'card' | 'mobile' | 'gift_card' | 'customer_credit' | 'check', amountPaid?: number, metadata?: any) => {
    if (!user) {
      toast.error('Connectez-vous pour encaisser', {
        description: 'Vous devez être connecté pour enregistrer une vente',
        action: {
          label: 'Se connecter',
          onClick: () => navigate('/auth')
        }
      });
      setPaymentDialogOpen(false);
      return;
    }

    // Si mode crédit client, vérifier qu'un client est sélectionné
    if (method === 'customer_credit' && !selectedCustomer) {
      toast.error('Client requis', {
        description: 'Veuillez sélectionner un client pour le paiement à crédit'
      });
      return;
    }

    // Si mode facture, vérifier qu'un client est sélectionné
    if (isInvoiceMode && !selectedCustomer) {
      toast.error('Client requis', {
        description: 'Veuillez sélectionner un client pour créer une facture'
      });
      setPaymentDialogOpen(false);
      setCustomerDialogOpen(true);
      return;
    }
    const totals = getTotals();

    // Map payment methods to DB enum types
    let dbPaymentMethod: 'cash' | 'card' | 'mobile' | 'check' | 'voucher' = 'cash';
    if (method === 'customer_credit' || method === 'gift_card') {
      dbPaymentMethod = 'voucher';
    } else {
      dbPaymentMethod = method as 'cash' | 'card' | 'mobile' | 'check';
    }
    const saleData = {
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total_discount: totals.totalDiscount,
      total: totals.total,
      payment_method: dbPaymentMethod,
      amount_paid: amountPaid || totals.total,
      change_amount: amountPaid ? Math.max(0, amountPaid - totals.total) : 0,
      is_invoice: method === 'customer_credit' ? false : isInvoiceMode, // Crédit = toujours ticket
      is_cancelled: false,
      cashier_id: user.id,
      customer_id: selectedCustomer?.id,
      items: cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_barcode: item.product.barcode,
        quantity: item.quantity,
        unit_price: item.custom_price ?? item.product.price,
        vat_rate: item.product.vat_rate,
        discount_type: item.discount?.type,
        discount_value: item.discount?.value || 0,
        subtotal: item.subtotal,
        vat_amount: item.vatAmount,
        total: item.total
      }))
    };
    try {
      const sale = await createSale.mutateAsync(saleData);

      // Si paiement par crédit client, créer la transaction de crédit
      if (method === 'customer_credit' && selectedCustomer && metadata?.creditAmount) {
        try {
          await chargeCredit.mutateAsync({
            customerId: selectedCustomer.id,
            amount: metadata.creditAmount,
            saleId: sale.id,
            notes: `Vente ${sale.sale_number}`
          });
        } catch (creditError) {
          console.error('Error charging credit:', creditError);
          // Ne pas bloquer la vente, juste avertir
          toast.warning('Vente enregistrée, mais erreur lors de l\'enregistrement du crédit', {
            description: 'La transaction de crédit devra être ajoutée manuellement'
          });
        }
      }

      // Préparer les données de vente pour le reçu
      const saleForReceipt = {
        ...sale,
        saleNumber: sale.sale_number,
        date: sale.date,
        items: cart,
        subtotal: totals.subtotal,
        totalVat: totals.totalVat,
        totalDiscount: totals.totalDiscount,
        total: totals.total,
        paymentMethod: method,
        amountPaid: amountPaid || totals.total,
        change: amountPaid ? Math.max(0, amountPaid - totals.total) : 0,
        is_invoice: method === 'customer_credit' ? false : isInvoiceMode, // Crédit = toujours ticket
        customer: selectedCustomer
      };
      setCurrentSale(saleForReceipt);

      // Mettre à jour l'affichage client avec statut "completed"
      const completedState = {
        items: [],
        status: 'completed',
        timestamp: Date.now()
      };
      displayChannel.postMessage(completedState);
      localStorage.setItem('customer_display_state', JSON.stringify(completedState));

      // Retour à "idle" après 5 secondes
      setTimeout(() => {
        const idleState = {
          items: [],
          status: 'idle',
          timestamp: Date.now()
        };
        displayChannel.postMessage(idleState);
        localStorage.setItem('customer_display_state', JSON.stringify(idleState));
      }, 5000);
      setCart([]);
      setGlobalDiscount(null);
      setAppliedPromoCode(null);
      setAppliedAutoPromotion(null);
      setIsInvoiceMode(false);
      setSelectedCustomer(null);
      setPaymentDialogOpen(false);

      // Demander si l'utilisateur veut imprimer
      setPrintConfirmDialogOpen(true);
      toast.success(
        method === 'customer_credit' 
          ? `Paiement à crédit enregistré (${metadata?.creditAmount?.toFixed(2) || totals.total.toFixed(2)}€)`
          : isInvoiceMode 
            ? 'Facture créée' 
            : 'Paiement validé'
      );
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Erreur lors de la création de la vente', {
        description: 'Veuillez réessayer'
      });
    }
  };
  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setGlobalDiscount(null);
      setAppliedPromoCode(null);
      setAppliedAutoPromotion(null);
      setIsInvoiceMode(false);
      setSelectedCustomer(null);

      // Retour à l'état "idle" sur l'affichage client
      const idleState = {
        items: [],
        status: 'idle',
        timestamp: Date.now()
      };
      displayChannel.postMessage(idleState);
      localStorage.setItem('customer_display_state', JSON.stringify(idleState));
      toast.info('Panier vidé');
    }
  };

  // Gestionnaire pour charger un panier sauvegardé
  const handleLoadCart = (cartData: any) => {
    setCart(cartData);
    toast.success('Panier chargé');
  };

  // Gestionnaires pour le dialog de scan physique
  const handlePhysicalScanAddToCart = () => {
    if (scannedProduct) {
      handleProductSelect(scannedProduct);
    }
  };
  const handlePhysicalScanViewProduct = () => {
    if (scannedProduct) {
      navigate(`/products?id=${scannedProduct.id}`);
    }
  };
  const handlePhysicalScanCreateProduct = () => {
    navigate(`/products?new=1&barcode=${encodeURIComponent(scannedBarcode)}`);
  };

  // Gestionnaire pour paiement mixte
  const handleMixedPayment = async (payments: Array<{
    method: 'cash' | 'card' | 'mobile';
    amount: number;
  }>) => {
    if (!user) {
      toast.error('Connectez-vous pour encaisser');
      setMixedPaymentDialogOpen(false);
      return;
    }
    const totals = getTotals();

    // Calculer le montant espèces pour le tiroir-caisse
    const cashAmount = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0);
    const saleData = {
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total_discount: totals.totalDiscount,
      total: totals.total,
      payment_method: 'cash' as const,
      // Méthode principale pour compatibilité
      payment_methods: payments,
      // Détails des paiements
      payment_split: payments.reduce((acc, p) => ({
        ...acc,
        [p.method]: p.amount
      }), {}),
      amount_paid: totals.total,
      change_amount: 0,
      is_invoice: isInvoiceMode,
      is_cancelled: false,
      cashier_id: user.id,
      customer_id: isInvoiceMode ? selectedCustomer?.id : undefined,
      items: cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_barcode: item.product.barcode,
        quantity: item.quantity,
        unit_price: item.custom_price ?? item.product.price,
        vat_rate: item.product.vat_rate,
        discount_type: item.discount?.type,
        discount_value: item.discount?.value || 0,
        subtotal: item.subtotal,
        vat_amount: item.vatAmount,
        total: item.total
      }))
    };
    try {
      const sale = await createSale.mutateAsync(saleData);
      const saleForReceipt = {
        ...sale,
        saleNumber: sale.sale_number,
        date: sale.date,
        items: cart,
        subtotal: totals.subtotal,
        totalVat: totals.totalVat,
        totalDiscount: totals.totalDiscount,
        total: totals.total,
        paymentMethod: 'mixed',
        payments: payments
      };
      setCurrentSale(saleForReceipt);
      setTimeout(() => {
        const idleState = {
          items: [],
          status: 'idle',
          timestamp: Date.now()
        };
        displayChannel.postMessage(idleState);
        localStorage.setItem('customer_display_state', JSON.stringify(idleState));
      }, 5000);
      setCart([]);
      setGlobalDiscount(null);
      setAppliedPromoCode(null);
      setAppliedAutoPromotion(null);
      setIsInvoiceMode(false);
      setSelectedCustomer(null);
      setMixedPaymentDialogOpen(false);
      setPrintConfirmDialogOpen(true);
      toast.success('Paiement mixte validé');
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Erreur paiement mixte');
    }
  };
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsInvoiceMode(true);
    toast.success(`Client sélectionné: ${customer.name}`);
  };
  const handlePreviewReceipt = () => {
    if (cart.length === 0) return;
    const totals = getTotals();
    const previewSale = {
      saleNumber: 'PREVIEW-' + Date.now(),
      date: new Date(),
      items: cart,
      subtotal: totals.subtotal,
      totalVat: totals.totalVat,
      totalDiscount: totals.totalDiscount,
      total: totals.total,
      paymentMethod: 'cash' as const,
      is_invoice: isInvoiceMode,
      customer: isInvoiceMode ? selectedCustomer : undefined
    };
    setCurrentSale(previewSale);
    setReceiptDialogOpen(true);
  };
  const handleApplyPromoCode = (code: string, type: 'percentage' | 'amount', value: number) => {
    setAppliedPromoCode({
      code,
      type,
      value
    });
  };
  const handleApplyDiscount = (type: DiscountType, value: number) => {
    if (!discountTarget) return;
    if (discountTarget.type === 'item' && discountTarget.index !== undefined) {
      // Remise sur un article
      const newCart = [...cart];
      const item = newCart[discountTarget.index];
      const discount = {
        type,
        value
      };
      const {
        subtotal,
        vatAmount,
        total
      } = calculateItemTotal(item.product, item.quantity, discount, item.custom_price, item.is_gift);
      newCart[discountTarget.index] = {
        ...item,
        discount,
        subtotal,
        vatAmount,
        total
      };
      setCart(newCart);
      toast.success('Remise appliquée');
    } else {
      // Remise globale
      setGlobalDiscount({
        type,
        value
      });
      toast.success('Remise globale appliquée');
    }
    setDiscountDialogOpen(false);
    setDiscountTarget(null);
  };
  const handleRemoveDiscount = (index: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const {
      subtotal,
      vatAmount,
      total
    } = calculateItemTotal(item.product, item.quantity, undefined, item.custom_price, item.is_gift);
    newCart[index] = {
      ...item,
      discount: undefined,
      subtotal,
      vatAmount,
      total
    };
    setCart(newCart);
    toast.info('Remise retirée');
  };
  const handleNumberClick = (num: string) => {
    if (calcMode === 'math' && waitingForOperand) {
      setQuantityInput(num);
      setWaitingForOperand(false);
    } else {
      setQuantityInput(prev => prev === '1' ? num : prev + num);
    }
  };
  const handleClearQuantity = () => {
    setQuantityInput('1');
    setCurrentValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };
  const handleOperation = (op: string) => {
    const inputValue = parseFloat(quantityInput || '0');
    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operation) {
      const newValue = performCalculation(currentValue, inputValue, operation);
      setQuantityInput(String(newValue));
      setCurrentValue(newValue);
    }
    setWaitingForOperand(true);
    setOperation(op);
  };
  const performCalculation = (first: number, second: number, op: string): number => {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '*':
        return first * second;
      case '/':
        return second !== 0 ? first / second : 0;
      case '%':
        return first * (second / 100);
      default:
        return second;
    }
  };
  const handleEqualsCalc = () => {
    const inputValue = parseFloat(quantityInput || '0');
    if (currentValue !== null && operation) {
      const result = performCalculation(currentValue, inputValue, operation);
      setQuantityInput(String(result));
      setCurrentValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };
  const handleOpenDay = (openingAmount: number) => {
    openDay.mutate(openingAmount, {
      onSuccess: () => {
        setIsDayOpenLocal(true);
        setOpenDayDialogOpen(false);
      }
    });
  };
  const handleCloseDay = async (closingAmount: number, archiveAndDelete?: boolean) => {
    if (!todayReport) return;
    const data = await getTodayReportData();
    closeDay.mutate({
      reportId: todayReport.id,
      closingAmount,
      reportData: data
    }, {
      onSuccess: () => {
        setIsDayOpenLocal(false);
        setCloseDayDialogOpen(false);
      }
    });

    // L'archivage et la suppression sont déjà gérés dans CloseDayDialog
    if (archiveAndDelete) {
      console.log('Archive créée et ventes anciennes supprimées');
    }
  };
  const handleReportX = async () => {
    const data = await getTodayReportData();
    setReportData(data);
    setReportXDialogOpen(true);
  };
  const totals = getTotals();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Pin Lock Dialog */}
      <PinLockDialog open={isLocked} onUnlock={() => setIsLocked(false)} />
      
      {/* Info bar avec date, météo, recherche et boutons */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border px-2 py-1 flex items-center justify-between gap-1.5 flex-shrink-0">
        {/* Gauche: Date/Heure + Météo */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-1.5 py-1 bg-background rounded-md border border-border">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="text-[10px] whitespace-nowrap">
              <span className="font-bold">{currentTime.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit'
              })}</span>
              <span className="text-muted-foreground ml-1">{currentTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 px-1.5 py-1 bg-background rounded-md border border-border">
            <CloudSun className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="text-[10px] font-bold whitespace-nowrap">
              {weatherLoading ? '...' : `${temperature}°C`}
            </div>
          </div>
        </div>

        {/* Centre: Barre de recherche */}
        <div className="flex-1 max-w-xs">
          <form onSubmit={handleScanSubmit}>
            <div className="relative">
              <Scan className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-primary" />
              <Input ref={scanInputRef} value={scanInput} onChange={e => {
              setScanInput(e.target.value);
              if (!e.target.value.trim()) {
                setSearchResults([]);
              }
            }} placeholder="Rechercher..." autoComplete="off" className="h-7 pl-7 pr-6 text-xs bg-background border-input text-foreground" />
              {scanInput && <Button type="button" onClick={() => {
              setScanInput('');
              setSearchResults([]);
              scanInputRef.current?.focus();
            }} className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 bg-transparent hover:bg-destructive/10 text-muted-foreground hover:text-destructive" variant="ghost">
                  ×
                </Button>}
            </div>
          </form>
        </div>
        
        {/* Droite: Boutons Affichage et Gestion */}
        <div className="flex items-center gap-0.5">
          {!isDayOpenEffective ? (
            <Button onClick={() => setOpenDayDialogOpen(true)} size="sm" className="h-6 px-2 text-xs bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md whitespace-nowrap">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Ouvrir</span>
            </Button>
          ) : (
            <>
              <Button onClick={handleReportX} size="sm" className="h-6 px-2 text-xs bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md whitespace-nowrap">
                <FileText className="h-3 w-3 mr-1" />
                <span>Rapport X</span>
              </Button>
              <Button onClick={() => setCloseDayDialogOpen(true)} size="sm" className="h-6 px-2 text-xs bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md whitespace-nowrap">
                <CalendarX className="h-3 w-3 mr-1" />
                <span>Fermer</span>
              </Button>
            </>
          )}
          <Button onClick={openCustomerDisplay} size="sm" className="h-6 px-2 text-xs bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md whitespace-nowrap">
            <Eye className="h-3 w-3 mr-1" />
            <span>Affichage</span>
          </Button>
        </div>
      </div>
      
      {/* Hidden input to capture scanner input without stealing focus */}
      <input type="text" aria-hidden="true" tabIndex={-1} style={{
      position: 'absolute',
      left: '-9999px',
      width: '1px',
      height: '1px',
      opacity: 0,
      pointerEvents: 'none'
    }} autoFocus={false} />
      {/* Main content - Toujours 3 colonnes (proportions adaptées mobile) */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT PANEL - Ticket (col-span adapté: 6 sur mobile, 5 sur desktop) */}
        <div className="col-span-6 md:col-span-5 bg-white border-r-2 border-border flex flex-col overflow-hidden shadow-xl">
          {/* Ticket header - Clean gradient */}
          <div className="bg-gradient-to-r from-primary to-primary-glow p-2 flex-shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" />
                <h2 className="font-bold text-sm">Ticket</h2>
              </div>
              <div className="bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <span className="text-xs font-bold">{totalItems} articles</span>
              </div>
            </div>
          </div>

          {/* Items list - Modern cards */}
          <ScrollArea className="flex-1 p-1.5 bg-background/50">
            {cart.length === 0 ? <div className="text-center py-6">
                <div className="p-3 bg-muted/50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-[10px]">Panier vide</p>
              </div> : <div className="space-y-1">
                {cart.map((item, index) => <div key={index} className="bg-white border border-border p-1.5 rounded-lg hover:border-primary/40 transition-all group">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <div className="text-foreground font-bold text-[10px] truncate flex-1">{item.product.name}</div>
                          {item.is_gift && <span className="text-[8px] bg-gradient-to-r from-pink-500 to-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">🎁 OFFERT</span>}
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Input data-scan-ignore="true" type="text" key={`price-${index}-${item.custom_price ?? item.product.price}`} defaultValue={item.custom_price ?? item.product.price} onBlur={e => {
                      const value = e.target.value.replace(',', '.');
                      const newPrice = parseFloat(value);
                      if (!isNaN(newPrice) && newPrice > 0) {
                        handleUpdatePrice(index, newPrice);
                      } else {
                        e.target.value = (item.custom_price ?? item.product.price).toString();
                      }
                    }} className="h-4 w-10 text-[9px] px-0.5 text-center bg-background" disabled={item.is_gift} />
                          <span className="text-muted-foreground text-[9px]">€/{item.product.unit || 'u'} × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}</span>
                        </div>
                        {item.discount && <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="text-[9px] bg-accent/20 text-accent px-1 py-0.5 rounded">
                              -{item.discount.type === 'percentage' ? `${item.discount.value}%` : `${item.discount.value}€`}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveDiscount(index)} className="h-3 w-3 p-0 text-muted-foreground hover:text-destructive">
                              ×
                            </Button>
                          </div>}
                      </div>
                      <div className="flex flex-col gap-0.5 items-end ml-1">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-4 w-4 hover:bg-destructive/20 text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleGift(index)} className={`h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${item.is_gift ? 'bg-pink-500/20 text-pink-600 hover:bg-pink-500/30' : 'hover:bg-pink-500/10 text-pink-500'}`} title={item.is_gift ? 'Annuler cadeau' : 'Offrir'}>
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                    setDiscountTarget({
                      type: 'item',
                      index
                    });
                    setDiscountDialogOpen(true);
                  }} className="h-4 w-4 hover:bg-accent/20 text-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" disabled={item.is_gift}>
                          <Percent className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5 bg-muted/50 p-0.5 rounded-lg">
                        <Button size="sm" onClick={() => handleUpdateQuantity(index, Math.max(0.1, item.quantity - 1))} className="h-5 w-5 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary text-[10px]">
                          -
                        </Button>
                        <Input data-scan-ignore="true" type="text" key={`qty-${index}-${item.quantity}`} defaultValue={item.quantity.toFixed(3)} onBlur={e => {
                    const value = e.target.value.replace(',', '.');
                    const newQty = parseFloat(value);
                    if (!isNaN(newQty) && newQty > 0) {
                      handleUpdateQuantity(index, newQty);
                    } else {
                      e.target.value = item.quantity.toFixed(3);
                    }
                  }} className="h-5 w-12 text-[10px] px-0.5 text-center bg-white font-bold" />
                        <span className="text-[10px] text-muted-foreground self-center">{item.product.unit || 'u'}</span>
                        <Button size="sm" onClick={() => handleUpdateQuantity(index, item.quantity + 1)} className="h-5 w-5 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary text-[10px]">
                          +
                        </Button>
                      </div>
                      <div className={`text-xs font-bold ${item.is_gift ? 'text-pink-600' : 'text-primary'}`}>
                        {item.is_gift ? 'OFFERT' : `${item.total.toFixed(2)}€`}
                      </div>
                    </div>
                  </div>)}
              </div>}
          </ScrollArea>

          {/* Totals - Modern design */}
          <div className="bg-white border-t-2 border-border p-1.5 space-y-1 flex-shrink-0">
            {/* Ticket/Facture toggle */}
            
            <div className="flex justify-between text-muted-foreground text-[10px]">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[10px]">
              <span>TVA</span>
              <span className="font-medium">{totals.totalVat.toFixed(2)}€</span>
            </div>
            {totals.totalDiscount > 0 && <div className="flex justify-between text-accent text-[10px]">
                <span>Remise totale</span>
                <span className="font-medium">-{totals.totalDiscount.toFixed(2)}€</span>
              </div>}
            {globalDiscount && <div className="flex items-center justify-between text-[9px] bg-accent/10 px-1.5 py-0.5 rounded">
                <span className="text-accent">
                  Remise globale: {globalDiscount.type === 'percentage' ? `${globalDiscount.value}%` : `${globalDiscount.value}€`}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setGlobalDiscount(null)} className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive">
                  ×
                </Button>
              </div>}
            {appliedPromoCode && <div className="flex items-center justify-between text-[9px] bg-primary/10 px-1.5 py-0.5 rounded">
                <span className="text-primary flex items-center gap-0.5">
                  <Ticket className="h-2.5 w-2.5" />
                  Code {appliedPromoCode.code}: {appliedPromoCode.type === 'percentage' ? `${appliedPromoCode.value}%` : `${appliedPromoCode.value}€`}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setAppliedPromoCode(null)} className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive">
                  ×
                </Button>
              </div>}
            {appliedAutoPromotion && totals.autoPromotionAmount && totals.autoPromotionAmount > 0 && (
              <div className="flex items-center justify-between text-[9px] bg-green-100 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-300 dark:border-green-700">
                <span className="text-green-700 dark:text-green-400 font-semibold flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  🎁 {appliedAutoPromotion.name}
                </span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  -{totals.autoPromotionAmount.toFixed(2)}€
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1">
              <Button variant="outline" size="sm" onClick={() => {
              setDiscountTarget({
                type: 'global'
              });
              setDiscountDialogOpen(true);
            }} disabled={cart.length === 0} className="h-6 text-[9px] border-accent text-accent hover:bg-accent/10">
                <Percent className="mr-0.5 h-2.5 w-2.5" />
                Remise
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPromoDialogOpen(true)} disabled={cart.length === 0} className="h-6 text-[9px] border-primary text-primary hover:bg-primary/10">
                <Ticket className="mr-0.5 h-2.5 w-2.5" />
                Code
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreviewReceipt} disabled={cart.length === 0} className="h-6 text-[9px] border-muted-foreground text-muted-foreground hover:bg-muted/50">
                <Eye className="mr-0.5 h-2.5 w-2.5" />
                Aperçu
              </Button>
            </div>
            <div className="flex justify-between items-center text-primary text-base font-bold pt-1 border-t-2 border-border">
              <span>TOTAL</span>
              <span>{totals.total.toFixed(2)}€</span>
            </div>
          </div>

          {/* Payment buttons - Modern JL Prod style */}
          <div className="bg-background p-1.5 space-y-1.5 border-t-2 border-border flex-shrink-0">
            {/* Nouveaux boutons fonctionnalités */}
            <div className="grid grid-cols-4 gap-1 mb-1">
              <Button variant="outline" size="sm" onClick={() => setSavedCartsDialogOpen(true)} className="h-7 text-[9px] border-blue-500 text-blue-500 hover:bg-blue-500/10" title="Paniers sauvegardés">
                <FolderOpen className="h-3 w-3 mr-0.5" />
                Charger
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectCustomerDialogOpen(true)} className={`h-7 text-[9px] ${selectedCustomer ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' : 'border-purple-500 text-purple-500'} hover:bg-purple-500/10`} title="Sélectionner un client">
                <User className="h-3 w-3 mr-0.5" />
                {selectedCustomer ? selectedCustomer.name.split(' ')[0] : 'Client'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
              if (cart.length > 0) {
                setSavedCartsDialogOpen(true);
              }
            }} disabled={cart.length === 0} className="h-7 text-[9px] border-green-500 text-green-500 hover:bg-green-500/10" title="Sauvegarder le panier">
                <Save className="h-3 w-3 mr-0.5" />
                Sauver
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRefundDialogOpen(true)} className="h-7 text-[9px] border-orange-500 text-orange-500 hover:bg-orange-500/10" title="Créer un remboursement">
                <Undo2 className="h-3 w-3 mr-0.5" />
                Rembour.
              </Button>
            </div>
            
            <Button onClick={() => setPaymentDialogOpen(true)} disabled={cart.length === 0} className="w-full h-10 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              <Euro className="mr-1.5 h-4 w-4" />
              PAYER {cart.length > 0 && `${totals.total.toFixed(2)}€`}
            </Button>
            
            <Button onClick={() => setCancelCartDialogOpen(true)} disabled={cart.length === 0} className="w-full h-10 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive/80 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 className="mr-1.5 h-4 w-4" />
              ANNULER LE TICKET
            </Button>
          </div>
        </div>

        {/* COLONNE CENTRE - Calculatrice (col-span adapté: 4 sur mobile, 4 sur desktop) */}
        <div className="col-span-4 bg-background p-1 flex flex-col gap-1 overflow-hidden h-full">

          {/* Statistiques rapides - Améliorées */}
          <Card className="bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/10 border-2 border-primary/30 p-2.5 flex-shrink-0 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 relative z-10 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Statistiques du Jour
            </h3>
            
            <div className="grid grid-cols-2 gap-2 relative z-10 mb-2">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg p-2 border border-green-500/30 shadow-md">
                <div className="text-[8px] text-green-700 font-semibold uppercase mb-0.5">Total Ventes</div>
                <div className="text-2xl font-bold text-green-700">
                  {todayTotal.toFixed(2)}€
                </div>
                <div className={`text-[8px] font-bold mt-0.5 ${totalPercentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPercentChange >= 0 ? '↗' : '↘'} {totalPercentChange.toFixed(1)}% vs hier
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg p-2 border border-blue-500/30 shadow-md">
                <div className="text-[8px] text-blue-700 font-semibold uppercase mb-0.5">Nb Tickets</div>
                <div className="text-2xl font-bold text-blue-700">
                  {todayCount}
                </div>
                <div className={`text-[8px] font-bold mt-0.5 ${countPercentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {countPercentChange >= 0 ? '↗' : '↘'} {countPercentChange.toFixed(1)}% vs hier
                </div>
              </div>
            </div>
            
            {/* Détail par moyen de paiement */}
            <div className="grid grid-cols-4 gap-1 relative z-10">
              <div className="bg-white/60 rounded p-1.5 text-center border border-border/50">
                <div className="text-[7px] text-muted-foreground font-medium uppercase">Espèces</div>
                <div className="text-xs font-bold text-green-600">
                  {(todaySales?.filter(s => !s.is_cancelled && s.payment_method === 'cash').reduce((sum, s) => sum + s.total, 0) || 0).toFixed(2)}€
                </div>
              </div>
              <div className="bg-white/60 rounded p-1.5 text-center border border-border/50">
                <div className="text-[7px] text-muted-foreground font-medium uppercase">Carte</div>
                <div className="text-xs font-bold text-blue-600">
                  {(todaySales?.filter(s => !s.is_cancelled && s.payment_method === 'card').reduce((sum, s) => sum + s.total, 0) || 0).toFixed(2)}€
                </div>
              </div>
              <div className="bg-white/60 rounded p-1.5 text-center border border-border/50">
                <div className="text-[7px] text-muted-foreground font-medium uppercase">Virement</div>
                <div className="text-xs font-bold text-purple-600">
                  {(todaySales?.filter(s => !s.is_cancelled && s.payment_method === 'mobile').reduce((sum, s) => sum + s.total, 0) || 0).toFixed(2)}€
                </div>
              </div>
              <div className="bg-white/60 rounded p-1.5 text-center border border-border/50">
                <div className="text-[7px] text-muted-foreground font-medium uppercase">Crédit</div>
                <div className="text-xs font-bold text-cyan-600">
                  {(todaySales?.filter(s => !s.is_cancelled && s.payment_method === 'voucher').reduce((sum, s) => sum + s.total, 0) || 0).toFixed(2)}€
                </div>
              </div>
            </div>
          </Card>

          {/* Calculatrice moderne et visible */}
          <Card className="bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-slate-300 p-3 flex-shrink-0 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-slate-700" />
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {calcMode === 'input' ? 'Quantité' : 'Calcul'}
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant={calcMode === 'input' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`h-6 px-2 text-[9px] font-bold ${calcMode === 'input' ? 'bg-primary text-white' : 'bg-white'}`} 
                  onClick={() => setCalcMode('input')}
                >
                  QTÉ
                </Button>
                <Button 
                  variant={calcMode === 'math' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`h-6 px-2 text-[9px] font-bold ${calcMode === 'math' ? 'bg-primary text-white' : 'bg-white'}`} 
                  onClick={() => setCalcMode('math')}
                >
                  CALC
                </Button>
              </div>
            </div>
            
            {/* Affichage LCD style */}
            <div className="bg-gradient-to-b from-green-900 to-green-950 p-3 rounded-lg mb-2 border-4 border-slate-400 shadow-inner">
              <div className="text-green-400 text-3xl font-bold text-right font-mono tracking-wider drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                {quantityInput}
              </div>
            </div>
            
            {/* Clavier professionnel */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'C'].map(key => (
                <Button 
                  key={key} 
                  onClick={() => key === 'C' ? handleClearQuantity() : handleNumberClick(key)} 
                  className={`h-10 text-lg font-bold shadow-md transition-all active:scale-95 ${
                    key === 'C' 
                      ? 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-red-700' 
                      : key === '.' 
                      ? 'bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white border-2 border-orange-600'
                      : 'bg-gradient-to-b from-white to-gray-100 hover:from-gray-100 hover:to-gray-200 text-slate-800 border-2 border-slate-300'
                  }`}
                >
                  {key}
                </Button>
              ))}
            </div>
            
            {calcMode === 'math' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-4 gap-1">
                  {['+', '-', '×', '÷'].map((op, idx) => (
                    <Button 
                      key={op}
                      onClick={() => handleOperation(['+', '-', '*', '/'][idx])} 
                      className="h-9 text-base font-bold bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-blue-700 shadow-md"
                    >
                      {op}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    onClick={() => handleOperation('%')} 
                    className="h-9 text-sm font-bold bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-2 border-purple-700 shadow-md"
                  >
                    %
                  </Button>
                  <Button 
                    onClick={handleEqualsCalc} 
                    disabled={!quantityInput} 
                    className="h-9 text-base font-bold bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-2 border-green-700 shadow-md disabled:opacity-50"
                  >
                    =
                  </Button>
                </div>
              </div>
            )}
          </Card>


          {/* Historique des derniers tickets */}
          <Card className="bg-background border border-border p-1.5 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
              <h3 className="text-[9px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1">
                <ReceiptText className="h-2.5 w-2.5" />
                Derniers Tickets
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/sales')} className="h-4 text-[8px] px-1 hover:bg-primary/10 text-primary font-semibold">
                Tout
                <ChevronRight className="h-2 w-2 ml-0.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-0.5">
                {(!todaySales || todaySales.length === 0) && (
                  <div className="text-[8px] text-muted-foreground text-center py-2">
                    Aucun ticket aujourd'hui
                  </div>
                )}
                {todaySales?.filter(s => !s.is_cancelled).slice(0, 10).map(sale => {
                  const itemCount = sale.sale_items?.length || 0;
                  
                  // Icône selon le moyen de paiement
                  const PaymentIcon = sale.payment_method === 'card' ? CreditCard :
                                     sale.payment_method === 'cash' ? Banknote :
                                     sale.payment_method === 'mobile' ? Smartphone :
                                     sale.payment_method === 'voucher' ? UserCog : Ticket;
                  
                  const iconColor = sale.payment_method === 'card' ? 'text-blue-500' :
                                   sale.payment_method === 'cash' ? 'text-green-500' :
                                   sale.payment_method === 'mobile' ? 'text-purple-500' :
                                   sale.payment_method === 'voucher' ? 'text-cyan-500' : 'text-primary';
                  
                  return (
                    <button 
                      key={sale.id} 
                      onClick={() => {
                        if (!sale.sale_items || sale.sale_items.length === 0) {
                          toast.error('Ce ticket ne contient pas d\'articles');
                          return;
                        }
                        
                        const saleForReceipt = {
                          ...sale,
                          saleNumber: sale.sale_number,
                          items: sale.sale_items,
                          subtotal: sale.subtotal,
                          totalVat: sale.total_vat,
                          totalDiscount: sale.total_discount,
                          total: sale.total,
                          paymentMethod: sale.payment_method,
                          amountPaid: sale.amount_paid,
                          change: sale.change_amount
                        };
                        setCurrentSale(saleForReceipt);
                        setReceiptDialogOpen(true);
                      }} 
                      className="w-full p-1.5 bg-muted/30 hover:bg-primary/5 border border-border/30 rounded text-left transition-all hover:border-primary/30 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <PaymentIcon className={`h-3 w-3 ${iconColor} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {sale.sale_number}
                            </div>
                            <div className="text-[7px] text-muted-foreground flex items-center gap-1">
                              <span>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span>{itemCount} art.</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-primary flex-shrink-0">
                          {sale.total.toFixed(2)}€
                        </div>
                      </div>
                    </button>
                  );
                })}
                {(!todaySales || todaySales.filter(s => !s.is_cancelled).length === 0) && (
                  <div className="text-center py-3 text-[8px] text-muted-foreground">
                    Aucun ticket
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL - Articles/Catégories (col-span adapté: 2 sur mobile, 3 sur desktop) */}
        <div className="col-span-2 md:col-span-3 bg-white border-l border-border overflow-hidden h-full">
          <div className="p-1 h-full overflow-y-auto">
            {scanInput.trim() && searchResults.length === 0 ? <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Scan className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-[10px]">Aucun résultat</p>
              </div> : searchResults.length > 0 ? <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-foreground font-bold text-[10px] flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                    RÉSULTATS ({searchResults.length})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => {
                setScanInput('');
                setSearchResults([]);
              }} className="h-5 text-[9px] px-1">
                    Effacer
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchResults.map(product => <button key={product.id} onClick={() => handleSelectSearchResult(product)} className="w-full p-3 bg-muted/50 hover:bg-primary/10 border border-border rounded-lg text-left transition-all hover:shadow-md group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                            {product.name}
                          </div>
                          {product.barcode && <div className="text-xs text-muted-foreground mt-0.5">
                              Code: {product.barcode}
                            </div>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {product.type === 'weight' ? 'au kg' : 'unité'}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {product.price.toFixed(2)}€
                        </div>
                      </div>
                    </button>)}
                </div>
              </> : <div className="flex flex-col h-full">
                <h2 className="text-foreground font-bold text-sm mb-4 px-2 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary"></div>
                  CATÉGORIES
                </h2>
                <div className="flex-1 overflow-hidden">
                  <CategoryGrid onProductSelect={handleProductSelect} onCategorySelect={setSelectedCategory} selectedCategory={selectedCategory} />
                </div>
                
              </div>}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DiscountDialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen} onApply={handleApplyDiscount} title={discountTarget?.type === 'global' ? 'Remise globale' : 'Remise sur article'} />

      <PromoCodeDialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen} onApply={handleApplyPromoCode} />

      <PaymentDialog 
        open={paymentDialogOpen} 
        onOpenChange={setPaymentDialogOpen} 
        total={totals.total} 
        onConfirmPayment={handleConfirmPayment} 
        onMixedPayment={() => {
          setPaymentDialogOpen(false);
          setMixedPaymentDialogOpen(true);
        }}
        onOpenCustomerCreditDialog={() => setCustomerCreditDialogOpen(true)}
        customerId={selectedCustomer?.id} 
      />

      <MixedPaymentDialog open={mixedPaymentDialogOpen} onOpenChange={setMixedPaymentDialogOpen} total={totals.total} onConfirmPayment={handleMixedPayment} customerId={selectedCustomer?.id} />

      <SavedCartsDialog open={savedCartsDialogOpen} onOpenChange={setSavedCartsDialogOpen} currentCart={cart} onLoadCart={handleLoadCart} />

      {/* Dialogue de sélection client */}
      <Dialog open={selectCustomerDialogOpen} onOpenChange={(open) => {
        setSelectCustomerDialogOpen(open);
        if (!open) setCustomerSearchTerm('');
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Sélectionner un client</DialogTitle>
          </DialogHeader>
          
          {/* Search and Create */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Rechercher un client (nom, email, téléphone)..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                setSelectCustomerDialogOpen(false);
                setCustomerDialogOpen(true);
              }}
              variant="default"
              className="whitespace-nowrap"
            >
              <User className="h-4 w-4 mr-2" />
              Créer Client
            </Button>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {/* Option pour désélectionner */}
              {selectedCustomer && (
                <Card
                  className="p-4 cursor-pointer hover:bg-destructive/10 border-2 border-destructive"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSelectCustomerDialogOpen(false);
                    toast.info('Client désélectionné');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <X className="h-5 w-5 text-destructive" />
                      <span className="font-semibold">Retirer le client</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Liste des clients */}
              {filteredCustomers?.map((customer) => {
                const creditAccount = creditAccounts?.find(acc => acc.customer_id === customer.id);
                const isCreditBlocked = customer.credit_blocked;
                const currentBalance = creditAccount?.current_balance || 0;
                
                return (
                    <Card
                      key={customer.id}
                      className={`p-4 border-2 transition-all ${
                        isCreditBlocked 
                          ? 'border-destructive bg-destructive/5 opacity-75' 
                          : selectedCustomer?.id === customer.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            if (isCreditBlocked) {
                              toast.error(`Client ${customer.name} bloqué pour le crédit`);
                              return;
                            }
                            setSelectedCustomer(customer);
                            setSelectCustomerDialogOpen(false);
                            toast.success(`Client sélectionné: ${customer.name}`);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-lg">{customer.name}</div>
                            {isCreditBlocked && (
                              <Badge variant="destructive" className="text-xs">
                                Crédit Bloqué
                              </Badge>
                            )}
                          </div>
                          {customer.email && (
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          )}
                          {customer.phone && (
                            <div className="text-sm text-muted-foreground">{customer.phone}</div>
                          )}
                          
                          {/* Solde crédit */}
                          {creditAccount && (
                            <div className="mt-2 flex items-center gap-4">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Limite crédit: </span>
                                <span className="font-semibold">{creditAccount.credit_limit.toFixed(2)}€</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Solde dû: </span>
                                <span className={`font-semibold ${currentBalance > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                                  {currentBalance.toFixed(2)}€
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Crédit disponible: </span>
                                <span className="font-semibold text-blue-500">
                                  {Math.max(0, creditAccount.credit_limit - currentBalance).toFixed(2)}€
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {creditAccount && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreditManagementCustomer({ id: customer.id, name: customer.name });
                                setCreditManagementDialogOpen(true);
                              }}
                              title="Gérer le crédit"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          {selectedCustomer?.id === customer.id && !isCreditBlocked && (
                            <CheckCircle className="h-6 w-6 text-primary" />
                          )}
                          {isCreditBlocked && (
                            <AlertCircle className="h-6 w-6 text-destructive" />
                          )}
                        </div>
                      </div>
                    </Card>
                );
              })}

              {(!filteredCustomers || filteredCustomers.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {customerSearchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
                  </p>
                  <Button
                    onClick={() => {
                      setSelectCustomerDialogOpen(false);
                      setCustomerDialogOpen(true);
                    }}
                    variant="outline"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Créer un nouveau client
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <RefundDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} />

      <PhysicalScanActionDialog open={physicalScanDialogOpen} onOpenChange={setPhysicalScanDialogOpen} barcode={scannedBarcode} product={scannedProduct} onAddToCart={handlePhysicalScanAddToCart} onViewProduct={handlePhysicalScanViewProduct} onCreateProduct={handlePhysicalScanCreateProduct} />

      <CustomerDialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen} onSelectCustomer={handleSelectCustomer} />

      {selectedCustomer && (
        <CustomerCreditDialog
          open={customerCreditDialogOpen}
          onOpenChange={setCustomerCreditDialogOpen}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          totalAmount={totals.total}
          onApply={(amount) => {
            // Appeler handleConfirmPayment avec le mode crédit client
            handleConfirmPayment('customer_credit', amount, { creditAmount: amount });
            setCustomerCreditDialogOpen(false);
          }}
        />
      )}


      {/* Confirmation d'impression */}
      <Dialog open={printConfirmDialogOpen} onOpenChange={setPrintConfirmDialogOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-primary">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl font-bold">Voulez-vous imprimer le ticket?</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-6">
              Impression sur imprimante thermique POS80
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => {
              setPrintConfirmDialogOpen(false);
              setCurrentSale(null);
            }} className="flex-1 h-14 text-base font-semibold">
                Non, merci
              </Button>
              <Button onClick={() => {
              setPrintConfirmDialogOpen(false);
              setReceiptDialogOpen(true);
            }} className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white text-base font-bold">
                Oui, imprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation d'annulation du ticket */}
      <Dialog open={cancelCartDialogOpen} onOpenChange={setCancelCartDialogOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-destructive">
          <DialogHeader>
            <DialogTitle className="text-destructive text-xl font-bold flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Annuler le ticket en cours?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Êtes-vous sûr de vouloir annuler ce ticket?
            </p>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold mb-2">Articles à supprimer:</p>
              <div className="space-y-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span className="font-medium">{item.total.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-destructive/20 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-destructive">{totals.total.toFixed(2)}€</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCancelCartDialogOpen(false)} 
                className="flex-1 h-14 text-base font-semibold"
              >
                Non, garder
              </Button>
              <Button 
                onClick={() => {
                  handleClearCart();
                  setCancelCartDialogOpen(false);
                  toast.success('Ticket annulé');
                }} 
                className="flex-1 h-14 bg-destructive hover:bg-destructive/90 text-white text-base font-bold"
              >
                Oui, annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'impression thermique */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm bg-white border-2 border-primary p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-primary font-bold text-center">TICKET DE CAISSE</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            {currentSale && <ThermalReceipt sale={currentSale} />}
          </div>
          <div className="p-4 border-t bg-muted/30 flex gap-2">
            <Button variant="outline" onClick={() => {
            setReceiptDialogOpen(false);
            setCurrentSale(null);
          }} className="flex-1 h-12 font-semibold">
              Fermer
            </Button>
            <Button onClick={() => {
            printThermalReceipt();
            setTimeout(() => {
              setReceiptDialogOpen(false);
              setCurrentSale(null);
            }, 500);
          }} className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold">
              IMPRIMER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Reports Dialogs */}
      <OpenDayDialog open={openDayDialogOpen} onOpenChange={setOpenDayDialogOpen} onConfirm={handleOpenDay} />

      <CloseDayDialog open={closeDayDialogOpen} onOpenChange={setCloseDayDialogOpen} onConfirm={handleCloseDay} reportData={reportData || {
      totalSales: 0,
      totalCash: 0,
      totalCard: 0,
      totalMobile: 0,
      salesCount: 0,
      vatByRate: {}
    }} todayReport={todayReport} />

      {reportData && <ReportXDialog open={reportXDialogOpen} onOpenChange={setReportXDialogOpen} reportData={reportData} todayReport={todayReport} />}

      {/* Customer Credit Management Dialog */}
      {creditManagementCustomer && (
        <CustomerCreditManagementDialog
          open={creditManagementDialogOpen}
          onOpenChange={setCreditManagementDialogOpen}
          customerId={creditManagementCustomer.id}
          customerName={creditManagementCustomer.name}
        />
      )}
    </div>;
};
export default Index;