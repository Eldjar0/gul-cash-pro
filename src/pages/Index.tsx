import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Scan,
  CreditCard,
  Banknote,
  Trash2,
  Euro,
  LogOut,
  Clock,
  ShoppingBag,
  Percent,
  Edit,
  Ticket,
  Eye,
  History,
  Settings as SettingsIcon,
} from 'lucide-react';
import logoMarket from '@/assets/logo-market.png';
import { CategoryGrid } from '@/components/pos/CategoryGrid';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { DiscountDialog } from '@/components/pos/DiscountDialog';
import { PromoCodeDialog } from '@/components/pos/PromoCodeDialog';
import { CustomerDialog } from '@/components/pos/CustomerDialog';
import { Receipt } from '@/components/pos/Receipt';

import { ThermalReceipt, printThermalReceipt } from '@/components/pos/ThermalReceipt';
import { Product, useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSale } from '@/hooks/useSales';
import { useCategories } from '@/hooks/useCategories';
import { Customer } from '@/hooks/useCustomers';
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
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const createSale = useCreateSale();
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [scanInput, setScanInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quantityInput, setQuantityInput] = useState('1');
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
  const [displayChannel] = useState(() => new BroadcastChannel('customer_display'));

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
    // Vider les résultats si le champ est vide
    if (!scanInput.trim()) {
      setSearchResults([]);
    }
  }, [scanInput]);

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

  // Traitement du code-barres scanné
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
        handleBarcodeScan(buffer);
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

  const calculateItemTotal = (product: Product, quantity: number, discount?: CartItem['discount'], customPrice?: number) => {
    const unitPrice = customPrice ?? product.price;
    const subtotal = unitPrice * quantity;
    const vatAmount = (subtotal * product.vat_rate) / 100;
    
    let discountAmount = 0;
    if (discount) {
      discountAmount = discount.type === 'percentage' 
        ? (subtotal * discount.value) / 100 
        : discount.value;
    }
    
    const total = subtotal + vatAmount - discountAmount;
    
    return { subtotal, vatAmount, total };
  };

  const handleSearch = () => {
    if (!scanInput.trim() || !products) {
      setSearchResults([]);
      return;
    }

    const normalizedInput = normalizeBarcode(scanInput);
    const searchTerm = scanInput.toLowerCase();
    
    // Recherche exacte par code-barre normalisé d'abord
    const exactBarcode = products.find(p => 
      p.barcode && normalizeBarcode(p.barcode) === normalizedInput
    );
    if (exactBarcode) {
      // Ajout direct au panier
      handleProductSelect(exactBarcode);
      return;
    }

    // Si pas de correspondance exacte, recherche générale
    let results = products.filter((p) => {
      const normalizedBarcode = p.barcode ? normalizeBarcode(p.barcode) : '';
      return (
        normalizedBarcode.includes(normalizedInput) ||
        p.barcode?.toLowerCase().includes(searchTerm) ||
        p.name.toLowerCase().includes(searchTerm) ||
        p.id.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    });

    // Recherche par catégorie
    if (categories && categories.length > 0) {
      const matchingCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm)
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

    // Si aucun résultat et que c'est un scan direct (pas de résultats intermédiaires)
    if (results.length === 0 && searchTerm.length >= 3) {
      toast.error('Aucun produit trouvé', {
        description: `Code saisi: ${searchTerm}`,
        action: {
          label: 'Créer produit',
          onClick: () => navigate(`/products?new=1&barcode=${encodeURIComponent(searchTerm.replace(/\D+/g, ''))}`),
        },
      });
      setScanInput('');
      return;
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


  const handleConfirmPayment = async (method: 'cash' | 'card' | 'mobile', amountPaid?: number) => {
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
    
    const saleData = {
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total_discount: totals.totalDiscount,
      total: totals.total,
      payment_method: method,
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
    setQuantityInput(prev => prev === '1' ? num : prev + num);
  };

  const handleClearQuantity = () => {
    setQuantityInput('1');
  };

  const totals = getTotals();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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
      {/* Header redesigné */}
      <div className="bg-white border-b-2 border-border px-4 py-3 flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center p-1.5 border-2 border-primary/20">
              <img src={logoMarket} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">GÜL REYHAN</h1>
              <p className="text-xs text-muted-foreground">Caisse #1</p>
            </div>
          </div>

          {/* Boutons de navigation centraux */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/sales')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-10 px-4 shadow-md"
            >
              <History className="h-4 w-4 mr-2" />
              Ventes
            </Button>
            <Button
              onClick={() => navigate('/products')}
              className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-10 px-4 shadow-md"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Produits
            </Button>
            <Button
              onClick={openCustomerDisplay}
              className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white h-10 px-4 shadow-md"
            >
              <Eye className="h-4 w-4 mr-2" />
              Affichage
            </Button>
          </div>

          {/* Date/Heure et actions à droite */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-muted/50 to-muted rounded-xl border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <div className="text-right">
                <div className="text-xs font-bold text-foreground leading-tight">
                  {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            {user ? (
              <>
                <Button
                  onClick={() => navigate('/settings')}
                  size="icon"
                  className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-10 w-10 shadow-md"
                  title="Paramètres"
                >
                  <SettingsIcon className="h-5 w-5" />
                </Button>
                <Button
                  onClick={signOut}
                  size="icon"
                  className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-10 w-10 shadow-md"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-br from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white h-10 px-4 shadow-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Connexion
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content - 3 colonnes: TICKET (5) | CALCULATRICE (4) | ARTICLES (3) */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT PANEL - Ticket à gauche */}
        <div className="col-span-5 bg-white border-r-2 border-border flex flex-col overflow-hidden shadow-xl">
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
          <ScrollArea className="flex-1 p-2 bg-background/50 max-h-[calc(100vh-400px)]">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">Panier vide</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Scannez un produit</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-border p-2 rounded-lg hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-bold text-xs truncate">{item.product.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
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
                            className="h-5 w-14 text-xs px-1 text-center bg-background"
                          />
                          <span className="text-muted-foreground text-xs">€/{item.product.unit || 'u'} × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}</span>
                        </div>
                        {item.discount && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs bg-accent/20 text-accent px-1 py-0.5 rounded">
                              -{item.discount.type === 'percentage' ? `${item.discount.value}%` : `${item.discount.value}€`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDiscount(index)}
                              className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
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
                          className="h-6 w-6 hover:bg-destructive/20 text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDiscountTarget({ type: 'item', index });
                            setDiscountDialogOpen(true);
                          }}
                          className="h-6 w-6 hover:bg-accent/20 text-accent flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Percent className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, Math.max(0.1, item.quantity - 1))}
                          className="h-6 w-6 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary text-xs"
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
                          className="h-6 w-16 text-xs px-1 text-center bg-white font-bold"
                        />
                        <span className="text-xs text-muted-foreground self-center">{item.product.unit || 'u'}</span>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="h-6 w-6 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary text-xs"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-primary text-sm font-bold">
                        {item.total.toFixed(2)}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals - Modern design */}
          <div className="bg-white border-t-2 border-border p-2 space-y-2 flex-shrink-0">
            {/* Ticket/Facture toggle */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Label htmlFor="invoice-mode" className="text-xs font-semibold cursor-pointer">
                  {isInvoiceMode ? 'Facture' : 'Ticket'}
                </Label>
                {isInvoiceMode && selectedCustomer && (
                  <div className="text-xs text-muted-foreground truncate max-w-[100px]">
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
                    className="h-6 text-xs px-1"
                  >
                    <Edit className="h-3 w-3 mr-0.5" />
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
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>TVA</span>
              <span className="font-medium">{totals.totalVat.toFixed(2)}€</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-accent text-sm">
                <span>Remise totale</span>
                <span className="font-medium">-{totals.totalDiscount.toFixed(2)}€</span>
              </div>
            )}
            {globalDiscount && (
              <div className="flex items-center justify-between text-xs bg-accent/10 px-2 py-1 rounded">
                <span className="text-accent">
                  Remise globale: {globalDiscount.type === 'percentage' ? `${globalDiscount.value}%` : `${globalDiscount.value}€`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGlobalDiscount(null)}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            )}
            {appliedPromoCode && (
              <div className="flex items-center justify-between text-xs bg-primary/10 px-2 py-1 rounded">
                <span className="text-primary flex items-center gap-1">
                  <Ticket className="h-3 w-3" />
                  Code {appliedPromoCode.code}: {appliedPromoCode.type === 'percentage' ? `${appliedPromoCode.value}%` : `${appliedPromoCode.value}€`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAppliedPromoCode(null)}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDiscountTarget({ type: 'global' });
                  setDiscountDialogOpen(true);
                }}
                disabled={cart.length === 0}
                className="h-8 text-xs border-accent text-accent hover:bg-accent/10"
              >
                <Percent className="mr-1 h-3 w-3" />
                Remise
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPromoDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-8 text-xs border-primary text-primary hover:bg-primary/10"
              >
                <Ticket className="mr-1 h-3 w-3" />
                Code promo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewReceipt}
                disabled={cart.length === 0}
                className="h-8 text-xs border-muted-foreground text-muted-foreground hover:bg-muted/50"
              >
                <Eye className="mr-1 h-3 w-3" />
                Aperçu
              </Button>
            </div>
            <div className="flex justify-between items-center text-primary text-xl font-bold pt-2 border-t-2 border-border">
              <span>TOTAL</span>
              <span>{totals.total.toFixed(2)}€</span>
            </div>
          </div>

          {/* Payment buttons - Modern SHOPCAISSE style */}
          <div className="bg-background p-2 space-y-2 border-t-2 border-border flex-shrink-0">
            <Button
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cart.length === 0}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Euro className="mr-2 h-5 w-5" />
              PAYER {cart.length > 0 && `${totals.total.toFixed(2)}€`}
            </Button>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-10 text-xs bg-white hover:bg-primary/5 text-primary border-2 border-primary font-semibold shadow-sm"
              >
                <CreditCard className="mr-1 h-3 w-3" />
                CB
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-10 text-xs bg-white hover:bg-accent/5 text-accent border-2 border-accent font-semibold shadow-sm"
              >
                <Banknote className="mr-1 h-3 w-3" />
                ESP
              </Button>
              <Button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="h-10 text-xs bg-white hover:bg-destructive/5 text-destructive border-2 border-destructive font-semibold shadow-sm"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                ANN
              </Button>
            </div>
          </div>
        </div>

        {/* COLONNE CENTRE - Calculatrice & Scan */}
        <div className="col-span-4 bg-background p-2 flex flex-col gap-2 overflow-y-auto">
          {/* Zone de scan */}
          <Card className="bg-white border border-border p-2 flex-shrink-0 shadow-sm">
            <form onSubmit={handleScanSubmit}>
              <div className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-muted-foreground text-xs font-mono mb-1 block">
                    Rechercher produit {scanInput && `(${scanInput.length} car.)`}
                  </label>
                  <div className="relative">
                    <Input
                      ref={scanInputRef}
                      value={scanInput}
                      onChange={(e) => {
                        const normalized = normalizeBarcode(e.target.value);
                        setScanInput(normalized);
                        if (!normalized.trim()) {
                          setSearchResults([]);
                        }
                      }}
                      placeholder="Scannez ou tapez..."
                      autoComplete="off"
                      className="h-9 bg-background border-input text-foreground text-base font-mono focus:border-primary pr-8"
                    />
                    {scanInput && (
                      <Button
                        type="button"
                        onClick={() => {
                          setScanInput('');
                          setSearchResults([]);
                          scanInputRef.current?.focus();
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        variant="ghost"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-9 px-3 bg-primary hover:bg-primary/90 text-white"
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Clavier numérique */}
          <Card className="bg-white border border-border p-1.5 flex-shrink-0 shadow-sm">
            <div className="text-muted-foreground text-xs font-mono mb-1">Quantité</div>
            <div className="bg-muted p-1.5 rounded mb-1.5 border border-border">
              <div className="text-primary text-xl font-mono text-center font-bold">
                {quantityInput}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => key === 'C' ? handleClearQuantity() : handleNumberClick(key)}
                  className="h-9 text-sm font-bold bg-card hover:bg-muted text-foreground border border-border font-mono transition-all active:scale-95 shadow-sm hover:shadow-md"
                >
                  {key}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL - Articles/Catégories/Résultats */}
        <div className="col-span-3 bg-white border-l border-border overflow-y-auto max-h-[calc(100vh-60px)]">
          <div className="p-2">
            {scanInput.trim() && searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-muted/50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Scan className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Aucun résultat</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Essayez un autre terme de recherche</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-foreground font-bold text-sm flex items-center gap-2">
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
                    className="h-7 text-xs"
                  >
                    Effacer
                  </Button>
                </div>
                <div className="space-y-2">
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
                <CategoryGrid onProductSelect={handleProductSelect} />
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
    </div>
  );
};

export default Index;
