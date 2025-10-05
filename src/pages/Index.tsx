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
  const [savedCartsDialogOpen, setSavedCartsDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [mixedPaymentDialogOpen, setMixedPaymentDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      '&': '1', '!': '1', 'é': '2', '@': '2', '"': '3', '#': '3', 
      "'": '4', '$': '4', '(': '5', '%': '5', '-': '6', '^': '6',
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
        onClick: () => navigate(`/products?new=1&barcode=${encodeURIComponent(barcodeToUse)}`),
      },
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
    window.addEventListener('keydown', handler, { capture: true });

    return () => {
      window.removeEventListener('keydown', handler, { capture: true } as any);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [products]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pos-display">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-success mx-auto mb-4"></div>
          <p className="text-white font-medium">Chargement...</p>
        </div>
      </div>
    );
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
    const exactBarcode = products.find(p => 
      p.barcode && normalizeBarcode(p.barcode) === normalizedInput
    );
    if (exactBarcode) {
      // Ajout direct au panier
      handleProductSelect(exactBarcode);
      return;
    }

    // Si pas de correspondance exacte, recherche générale multi-critères
    let results = products.filter((p) => {
      const normalizedBarcode = p.barcode ? normalizeBarcode(p.barcode) : '';
      const name = strip(p.name);
      const desc = p.description ? strip(p.description) : '';
      const idStr = strip(p.id);
      
      // Recherche de base (nom, code-barres, description)
      let matches = (
        (hasDigits && normalizedBarcode.includes(normalizedInput)) ||
        (p.barcode && strip(p.barcode).includes(searchTerm)) ||
        name.includes(searchTerm) ||
        idStr.includes(searchTerm) ||
        desc.includes(searchTerm)
      );
      
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
      const matchingCategories = categories.filter((cat) =>
        strip(cat.name).includes(searchTerm)
      );
      
      if (matchingCategories.length > 0) {
        const categoryIds = matchingCategories.map((cat) => cat.id);
        const productsByCategory = products.filter((p) =>
          p.category_id && categoryIds.includes(p.category_id)
        );
        results = [...results, ...productsByCategory].filter(
          (product, index, self) => self.findIndex((p) => p.id === product.id) === index
        );
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
    const { subtotal, vatAmount, total } = calculateItemTotal(item.product, quantity, item.discount, item.custom_price);
    
    newCart[index] = {
      ...item,
      quantity,
      subtotal,
      vatAmount,
      total,
    };
    
    setCart(newCart);
  };

  const handleUpdatePrice = (index: number, newPrice: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const { subtotal, vatAmount, total } = calculateItemTotal(item.product, item.quantity, item.discount, newPrice);
    
    newCart[index] = {
      ...item,
      custom_price: newPrice,
      subtotal,
      vatAmount,
      total,
    };
    
    setCart(newCart);
    toast.success('Prix modifié');
  };


  const handleConfirmPayment = async (method: 'cash' | 'card' | 'mobile' | 'gift_card' | 'customer_credit' | 'check', amountPaid?: number, metadata?: any) => {
    if (!user) {
      toast.error('Connectez-vous pour encaisser', {
        description: 'Vous devez être connecté pour enregistrer une vente',
        action: {
          label: 'Se connecter',
          onClick: () => navigate('/auth'),
        },
      });
      setPaymentDialogOpen(false);
      return;
    }

    // Si mode facture, vérifier qu'un client est sélectionné
    if (isInvoiceMode && !selectedCustomer) {
      toast.error('Client requis', {
        description: 'Veuillez sélectionner un client pour créer une facture',
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
      amount_paid: amountPaid,
      change_amount: amountPaid ? amountPaid - totals.total : 0,
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
        total: item.total,
      })),
    };

    try {
      const sale = await createSale.mutateAsync(saleData);
      
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
        amountPaid: amountPaid,
        change: amountPaid ? amountPaid - totals.total : 0,
        is_invoice: isInvoiceMode,
        customer: isInvoiceMode ? selectedCustomer : undefined,
      };
      
      setCurrentSale(saleForReceipt);
      
      // Mettre à jour l'affichage client avec statut "completed"
      const completedState = {
        items: [],
        status: 'completed',
        timestamp: Date.now(),
      };
      displayChannel.postMessage(completedState);
      localStorage.setItem('customer_display_state', JSON.stringify(completedState));
      
      // Retour à "idle" après 5 secondes
      setTimeout(() => {
        const idleState = {
          items: [],
          status: 'idle',
          timestamp: Date.now(),
        };
        displayChannel.postMessage(idleState);
        localStorage.setItem('customer_display_state', JSON.stringify(idleState));
      }, 5000);
      
      setCart([]);
      setGlobalDiscount(null);
      setAppliedPromoCode(null);
      setIsInvoiceMode(false);
      setSelectedCustomer(null);
      setPaymentDialogOpen(false);
      
      // Demander si l'utilisateur veut imprimer
      setPrintConfirmDialogOpen(true);
      toast.success(isInvoiceMode ? 'Facture créée' : 'Paiement validé');
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Erreur paiement');
    }
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setGlobalDiscount(null);
      setAppliedPromoCode(null);
      setIsInvoiceMode(false);
      setSelectedCustomer(null);
      
      // Retour à l'état "idle" sur l'affichage client
      const idleState = {
        items: [],
        status: 'idle',
        timestamp: Date.now(),
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
  const handleMixedPayment = async (payments: Array<{ method: 'cash' | 'card' | 'mobile'; amount: number }>) => {
    if (!user) {
      toast.error('Connectez-vous pour encaisser');
      setMixedPaymentDialogOpen(false);
      return;
    }

    const totals = getTotals();
    
    // Calculer le montant espèces pour le tiroir-caisse
    const cashAmount = payments
      .filter(p => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    const saleData = {
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total_discount: totals.totalDiscount,
      total: totals.total,
      payment_method: 'cash' as const, // Méthode principale pour compatibilité
      payment_methods: payments, // Détails des paiements
      payment_split: payments.reduce((acc, p) => ({ ...acc, [p.method]: p.amount }), {}),
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
        total: item.total,
      })),
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
        payments: payments,
      };

      setCurrentSale(saleForReceipt);
      
      setTimeout(() => {
        const idleState = {
          items: [],
          status: 'idle',
          timestamp: Date.now(),
        };
        displayChannel.postMessage(idleState);
        localStorage.setItem('customer_display_state', JSON.stringify(idleState));
      }, 5000);
      
      setCart([]);
      setGlobalDiscount(null);
      setAppliedPromoCode(null);
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
      customer: isInvoiceMode ? selectedCustomer : undefined,
    };
    
    setCurrentSale(previewSale);
    setReceiptDialogOpen(true);
  };

  const handleApplyPromoCode = (code: string, type: 'percentage' | 'amount', value: number) => {
    setAppliedPromoCode({ code, type, value });
  };


  const handleApplyDiscount = (type: DiscountType, value: number) => {
    if (!discountTarget) return;
    
    if (discountTarget.type === 'item' && discountTarget.index !== undefined) {
      // Remise sur un article
      const newCart = [...cart];
      const item = newCart[discountTarget.index];
      const discount = { type, value };
      const { subtotal, vatAmount, total } = calculateItemTotal(
        item.product,
        item.quantity,
        discount,
        item.custom_price
      );
      
      newCart[discountTarget.index] = {
        ...item,
        discount,
        subtotal,
        vatAmount,
        total,
      };
      
      setCart(newCart);
      toast.success('Remise appliquée');
    } else {
      // Remise globale
      setGlobalDiscount({ type, value });
      toast.success('Remise globale appliquée');
    }
    
    setDiscountDialogOpen(false);
    setDiscountTarget(null);
  };

  const handleRemoveDiscount = (index: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const { subtotal, vatAmount, total } = calculateItemTotal(
      item.product,
      item.quantity,
      undefined,
      item.custom_price
    );
    
    newCart[index] = {
      ...item,
      discount: undefined,
      subtotal,
      vatAmount,
      total,
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
      },
    });
  };

  const handleCloseDay = async (closingAmount: number, archiveAndDelete?: boolean) => {
    if (!todayReport) return;
    
    const data = await getTodayReportData();
    closeDay.mutate({
      reportId: todayReport.id,
      closingAmount,
      reportData: data,
    }, {
      onSuccess: () => {
        setIsDayOpenLocal(false);
        setCloseDayDialogOpen(false);
      },
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

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Pin Lock Dialog */}
      <PinLockDialog 
        open={isLocked} 
        onUnlock={() => setIsLocked(false)} 
      />
      
      {/* Info bar avec date, météo, recherche et boutons */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border px-2 py-1 flex items-center justify-between gap-1.5 flex-shrink-0">
        {/* Gauche: Date/Heure + Météo */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-1.5 py-1 bg-background rounded-md border border-border">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="text-[10px] whitespace-nowrap">
              <span className="font-bold">{currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
              <span className="text-muted-foreground ml-1">{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
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
              <Input
                ref={scanInputRef}
                value={scanInput}
                onChange={(e) => {
                  setScanInput(e.target.value);
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                  }
                }}
                placeholder="Rechercher..."
                autoComplete="off"
                className="h-7 pl-7 pr-6 text-xs bg-background border-input text-foreground"
              />
              {scanInput && (
                <Button
                  type="button"
                  onClick={() => {
                    setScanInput('');
                    setSearchResults([]);
                    scanInputRef.current?.focus();
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 bg-transparent hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  variant="ghost"
                >
                  ×
                </Button>
              )}
            </div>
          </form>
        </div>
        
        {/* Droite: Bouton Affichage uniquement */}
        <div className="flex items-center gap-0.5">
          <Button
            onClick={openCustomerDisplay}
            size="sm"
            className="h-6 px-2 text-xs bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md whitespace-nowrap"
          >
            <Eye className="h-3 w-3 mr-1" />
            <span>Affichage</span>
          </Button>
        </div>
      </div>
      
      {/* Hidden input to capture scanner input without stealing focus */}
      <input
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        autoFocus={false}
      />
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
            {cart.length === 0 ? (
              <div className="text-center py-6">
                <div className="p-3 bg-muted/50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-[10px]">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-1">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-border p-1.5 rounded-lg hover:border-primary/40 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-bold text-[10px] truncate">{item.product.name}</div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Input
                            data-scan-ignore="true"
                            type="text"
                            key={`price-${index}-${item.custom_price ?? item.product.price}`}
                            defaultValue={item.custom_price ?? item.product.price}
                            onBlur={(e) => {
                              const value = e.target.value.replace(',', '.');
                              const newPrice = parseFloat(value);
                              if (!isNaN(newPrice) && newPrice > 0) {
                                handleUpdatePrice(index, newPrice);
                              } else {
                                e.target.value = (item.custom_price ?? item.product.price).toString();
                              }
                            }}
                            className="h-4 w-10 text-[9px] px-0.5 text-center bg-background"
                          />
                          <span className="text-muted-foreground text-[9px]">€/{item.product.unit || 'u'} × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}</span>
                        </div>
                        {item.discount && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <span className="text-[9px] bg-accent/20 text-accent px-1 py-0.5 rounded">
                              -{item.discount.type === 'percentage' ? `${item.discount.value}%` : `${item.discount.value}€`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDiscount(index)}
                              className="h-3 w-3 p-0 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 items-end ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-4 w-4 hover:bg-destructive/20 text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDiscountTarget({ type: 'item', index });
                            setDiscountDialogOpen(true);
                          }}
                          className="h-4 w-4 hover:bg-accent/20 text-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Percent className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5 bg-muted/50 p-0.5 rounded-lg">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, Math.max(0.1, item.quantity - 1))}
                          className="h-5 w-5 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary text-[10px]"
                        >
                          -
                        </Button>
                        <Input
                          data-scan-ignore="true"
                          type="text"
                          key={`qty-${index}-${item.quantity}`}
                          defaultValue={item.quantity.toFixed(3)}
                          onBlur={(e) => {
                            const value = e.target.value.replace(',', '.');
                            const newQty = parseFloat(value);
                            if (!isNaN(newQty) && newQty > 0) {
                              handleUpdateQuantity(index, newQty);
                            } else {
                              e.target.value = item.quantity.toFixed(3);
                            }
                          }}
                          className="h-5 w-12 text-[10px] px-0.5 text-center bg-white font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground self-center">{item.product.unit || 'u'}</span>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="h-5 w-5 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary text-[10px]"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-primary text-xs font-bold">
                        {item.total.toFixed(2)}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals - Modern design */}
          <div className="bg-white border-t-2 border-border p-1.5 space-y-1 flex-shrink-0">
            {/* Ticket/Facture toggle */}
            <div className="flex items-center justify-between p-1.5 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="invoice-mode" className="text-[10px] font-semibold cursor-pointer">
                  {isInvoiceMode ? 'Facture' : 'Ticket'}
                </Label>
                {isInvoiceMode && selectedCustomer && (
                  <div className="text-[9px] text-muted-foreground truncate max-w-[80px]">
                    {selectedCustomer.name}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isInvoiceMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomerDialogOpen(true)}
                    className="h-5 text-[9px] px-1"
                  >
                    <Edit className="h-2.5 w-2.5 mr-0.5" />
                    {selectedCustomer ? 'Modif' : 'Client'}
                  </Button>
                )}
                <Switch
                  id="invoice-mode"
                  checked={isInvoiceMode}
                  onCheckedChange={(checked) => {
                    setIsInvoiceMode(checked);
                    if (checked && !selectedCustomer) {
                      setCustomerDialogOpen(true);
                    } else if (!checked) {
                      setSelectedCustomer(null);
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between text-muted-foreground text-[10px]">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[10px]">
              <span>TVA</span>
              <span className="font-medium">{totals.totalVat.toFixed(2)}€</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-accent text-[10px]">
                <span>Remise totale</span>
                <span className="font-medium">-{totals.totalDiscount.toFixed(2)}€</span>
              </div>
            )}
            {globalDiscount && (
              <div className="flex items-center justify-between text-[9px] bg-accent/10 px-1.5 py-0.5 rounded">
                <span className="text-accent">
                  Remise globale: {globalDiscount.type === 'percentage' ? `${globalDiscount.value}%` : `${globalDiscount.value}€`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalDiscount(null)}
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            )}
            {appliedPromoCode && (
              <div className="flex items-center justify-between text-[9px] bg-primary/10 px-1.5 py-0.5 rounded">
                <span className="text-primary flex items-center gap-0.5">
                  <Ticket className="h-2.5 w-2.5" />
                  Code {appliedPromoCode.code}: {appliedPromoCode.type === 'percentage' ? `${appliedPromoCode.value}%` : `${appliedPromoCode.value}€`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAppliedPromoCode(null)}
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDiscountTarget({ type: 'global' });
                  setDiscountDialogOpen(true);
                }}
                disabled={cart.length === 0}
                className="h-6 text-[9px] border-accent text-accent hover:bg-accent/10"
              >
                <Percent className="mr-0.5 h-2.5 w-2.5" />
                Remise
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPromoDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-6 text-[9px] border-primary text-primary hover:bg-primary/10"
              >
                <Ticket className="mr-0.5 h-2.5 w-2.5" />
                Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewReceipt}
                disabled={cart.length === 0}
                className="h-6 text-[9px] border-muted-foreground text-muted-foreground hover:bg-muted/50"
              >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSavedCartsDialogOpen(true)}
                className="h-7 text-[9px] border-blue-500 text-blue-500 hover:bg-blue-500/10"
                title="Paniers sauvegardés"
              >
                <FolderOpen className="h-3 w-3 mr-0.5" />
                Charger
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (cart.length > 0) {
                    setSavedCartsDialogOpen(true);
                  }
                }}
                disabled={cart.length === 0}
                className="h-7 text-[9px] border-green-500 text-green-500 hover:bg-green-500/10"
                title="Sauvegarder le panier"
              >
                <Save className="h-3 w-3 mr-0.5" />
                Sauver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMixedPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-7 text-[9px] border-purple-500 text-purple-500 hover:bg-purple-500/10"
                title="Paiement mixte"
              >
                <Split className="h-3 w-3 mr-0.5" />
                Mixte
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRefundDialogOpen(true)}
                className="h-7 text-[9px] border-orange-500 text-orange-500 hover:bg-orange-500/10"
                title="Créer un remboursement"
              >
                <Undo2 className="h-3 w-3 mr-0.5" />
                Rembour.
              </Button>
            </div>
            
            <Button
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cart.length === 0}
              className="w-full h-10 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Euro className="mr-1.5 h-4 w-4" />
              PAYER {cart.length > 0 && `${totals.total.toFixed(2)}€`}
            </Button>
            <div className="grid grid-cols-3 gap-1">
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-8 text-[10px] bg-white hover:bg-primary/5 text-primary border-2 border-primary font-semibold shadow-sm"
              >
                <CreditCard className="mr-0.5 h-2.5 w-2.5" />
                CB
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-8 text-[10px] bg-white hover:bg-accent/5 text-accent border-2 border-accent font-semibold shadow-sm"
              >
                <Banknote className="mr-0.5 h-2.5 w-2.5" />
                ESP
              </Button>
              <Button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="h-8 text-[10px] bg-white hover:bg-destructive/5 text-destructive border-2 border-destructive font-semibold shadow-sm"
              >
                <Trash2 className="mr-0.5 h-2.5 w-2.5" />
                ANN
              </Button>
            </div>
          </div>
        </div>

        {/* COLONNE CENTRE - Calculatrice (col-span adapté: 4 sur mobile, 4 sur desktop) */}
        <div className="col-span-4 bg-background p-1 flex flex-col gap-1 overflow-hidden h-full">

          {/* Statistiques rapides */}
          <Card className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/50 p-2 flex-shrink-0 shadow-md">
            <h3 className="text-[9px] font-bold text-primary uppercase tracking-wide mb-2">Statistiques du jour</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                <div className="text-[9px] text-muted-foreground mb-0.5">Total ventes</div>
                <div className="text-lg font-bold text-primary mb-0.5">
                  {todayTotal.toFixed(2)}€
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-semibold ${totalPercentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPercentChange >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {totalPercentChange >= 0 ? '+' : ''}{totalPercentChange.toFixed(1)}%
                </div>
              </div>
              <div className="bg-secondary/5 rounded-lg p-2 border border-secondary/10">
                <div className="text-[9px] text-muted-foreground mb-0.5">Nb tickets</div>
                <div className="text-lg font-bold text-secondary mb-0.5">
                  {todayCount}
                </div>
                <div className={`flex items-center gap-0.5 text-[9px] font-semibold ${countPercentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {countPercentChange >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {countPercentChange >= 0 ? '+' : ''}{countPercentChange.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>

          {/* Calculatrice moderne */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 p-2 flex-shrink-0 shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-center flex-1">
                <div className="text-[9px] font-semibold text-primary uppercase tracking-wide mb-0.5">Calculette</div>
                <div className="text-[9px] text-muted-foreground">{calcMode === 'input' ? 'Poids / Quantité / Prix' : 'Calcul'}</div>
              </div>
              <div className="flex gap-0.5">
                <Button
                  variant={calcMode === 'input' ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setCalcMode('input')}
                >
                  <Scale className="h-2.5 w-2.5" />
                </Button>
                <Button
                  variant={calcMode === 'math' ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setCalcMode('math')}
                >
                  <Calculator className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            
            {/* Affichage */}
            <div className="bg-gradient-to-br from-primary to-primary-glow p-2 rounded-xl mb-2 border-2 border-primary shadow-inner">
              <div className="text-white text-xl font-bold text-center font-mono tracking-wider drop-shadow-lg">
                {quantityInput}
              </div>
            </div>
            
            {/* Clavier */}
            <div className="grid grid-cols-3 gap-1">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => key === 'C' ? handleClearQuantity() : handleNumberClick(key)}
                  className={`h-8 text-sm font-bold transition-all active:scale-95 shadow-sm ${
                    key === 'C' 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0' 
                      : key === '.' 
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0'
                      : 'bg-gradient-to-br from-white to-gray-50 hover:from-primary/10 hover:to-primary/5 text-foreground border-2 border-border'
                  }`}
                >
                  {key}
                </Button>
              ))}
            </div>
            {calcMode === 'math' ? (
              <div className="mt-2">
                <div className="grid grid-cols-4 gap-1">
                  <Button onClick={() => handleOperation('+')} className="h-8 text-sm bg-primary/10 font-bold">+</Button>
                  <Button onClick={() => handleOperation('-')} className="h-8 text-sm bg-primary/10 font-bold"><Minus className="h-3.5 w-3.5" /></Button>
                  <Button onClick={() => handleOperation('*')} className="h-8 text-sm bg-primary/10 font-bold"><X className="h-3.5 w-3.5" /></Button>
                  <Button onClick={() => handleOperation('/')} className="h-8 text-sm bg-primary/10 font-bold"><Divide className="h-3.5 w-3.5" /></Button>
                  <Button onClick={() => handleOperation('%')} className="h-8 text-sm bg-primary/10 font-bold col-span-2"><Percent className="h-3.5 w-3.5 mr-0.5" />%</Button>
                  <Button onClick={handleEqualsCalc} disabled={!quantityInput} className="h-8 text-sm bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-md col-span-2">=</Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-[9px] text-center text-muted-foreground">
                  Tapez la quantité avant d'ajouter un article
                </div>
              </div>
            )}
          </Card>

          {/* Boutons gestion de journée - Carrés */}
          <Card className="bg-background border-2 border-border p-2 flex-shrink-0">
            <div className="grid grid-cols-3 gap-1">
              {!isDayOpenEffective ? (
                <Button
                  onClick={() => setOpenDayDialogOpen(true)}
                  className="h-12 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md font-semibold"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px]">Ouvrir</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleReportX}
                    className="h-12 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md font-semibold"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-[10px]">Rapport X</span>
                  </Button>
                  <Button
                    onClick={() => setCloseDayDialogOpen(true)}
                    className="h-12 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md font-semibold"
                  >
                    <CalendarX className="h-4 w-4" />
                    <span className="text-[10px]">Fermer</span>
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL - Articles/Catégories (col-span adapté: 2 sur mobile, 3 sur desktop) */}
        <div className="col-span-2 md:col-span-3 bg-white border-l border-border overflow-hidden h-full">
          <div className="p-1 h-full overflow-y-auto">
            {scanInput.trim() && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Scan className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-[10px]">Aucun résultat</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-foreground font-bold text-[10px] flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                    RÉSULTATS ({searchResults.length})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setScanInput('');
                      setSearchResults([]);
                    }}
                    className="h-5 text-[9px] px-1"
                  >
                    Effacer
                  </Button>
                </div>
                <div className="space-y-1">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectSearchResult(product)}
                      className="w-full p-3 bg-muted/50 hover:bg-primary/10 border border-border rounded-lg text-left transition-all hover:shadow-md group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                            {product.name}
                          </div>
                          {product.barcode && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Code: {product.barcode}
                            </div>
                          )}
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
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-foreground font-bold text-sm mb-4 px-2 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary"></div>
                  CATÉGORIES
                </h2>
                <CategoryGrid 
                  onProductSelect={handleProductSelect} 
                  onCategorySelect={setSelectedCategory}
                  selectedCategory={selectedCategory}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        onApply={handleApplyDiscount}
        title={discountTarget?.type === 'global' ? 'Remise globale' : 'Remise sur article'}
      />

      <PromoCodeDialog
        open={promoDialogOpen}
        onOpenChange={setPromoDialogOpen}
        onApply={handleApplyPromoCode}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={totals.total}
        onConfirmPayment={handleConfirmPayment}
        onMixedPayment={() => {
          setPaymentDialogOpen(false);
          setMixedPaymentDialogOpen(true);
        }}
        customerId={selectedCustomer?.id}
      />

      <MixedPaymentDialog
        open={mixedPaymentDialogOpen}
        onOpenChange={setMixedPaymentDialogOpen}
        total={totals.total}
        onConfirmPayment={handleMixedPayment}
        customerId={selectedCustomer?.id}
      />

      <SavedCartsDialog
        open={savedCartsDialogOpen}
        onOpenChange={setSavedCartsDialogOpen}
        currentCart={cart}
        onLoadCart={handleLoadCart}
      />

      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
      />

      <PhysicalScanActionDialog
        open={physicalScanDialogOpen}
        onOpenChange={setPhysicalScanDialogOpen}
        barcode={scannedBarcode}
        product={scannedProduct}
        onAddToCart={handlePhysicalScanAddToCart}
        onViewProduct={handlePhysicalScanViewProduct}
        onCreateProduct={handlePhysicalScanCreateProduct}
      />

      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSelectCustomer={handleSelectCustomer}
      />


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
              <Button
                variant="outline"
                onClick={() => {
                  setPrintConfirmDialogOpen(false);
                  setCurrentSale(null);
                }}
                className="flex-1 h-14 text-base font-semibold"
              >
                Non, merci
              </Button>
              <Button
                onClick={() => {
                  setPrintConfirmDialogOpen(false);
                  setReceiptDialogOpen(true);
                }}
                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white text-base font-bold"
              >
                Oui, imprimer
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
            <Button
              variant="outline"
              onClick={() => {
                setReceiptDialogOpen(false);
                setCurrentSale(null);
              }}
              className="flex-1 h-12 font-semibold"
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                printThermalReceipt();
                setTimeout(() => {
                  setReceiptDialogOpen(false);
                  setCurrentSale(null);
                }, 500);
              }}
              className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold"
            >
              IMPRIMER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Reports Dialogs */}
      <OpenDayDialog
        open={openDayDialogOpen}
        onOpenChange={setOpenDayDialogOpen}
        onConfirm={handleOpenDay}
      />

      <CloseDayDialog
        open={closeDayDialogOpen}
        onOpenChange={setCloseDayDialogOpen}
        onConfirm={handleCloseDay}
        reportData={reportData || { totalSales: 0, totalCash: 0, totalCard: 0, totalMobile: 0, salesCount: 0, vatByRate: {} }}
        todayReport={todayReport}
      />

      {reportData && (
        <ReportXDialog
          open={reportXDialogOpen}
          onOpenChange={setReportXDialogOpen}
          reportData={reportData}
          todayReport={todayReport}
        />
      )}
    </div>
  );
};

export default Index;
