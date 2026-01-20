import { useState, useEffect, useMemo, useCallback } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Smartphone, 
  Scan, Package, User, FileText, Percent, Gift, Grid3X3, DollarSign,
  Save, FolderOpen, Calculator, Clock, Euro, Wallet, Tag, RefreshCw,
  CalendarX, Calendar, FileSpreadsheet, Eye, Trash2, QrCode
} from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { useCreateSale } from '@/hooks/useSales';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import { useUnifiedScanner } from '@/hooks/useUnifiedScanner';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { MixedPaymentDialog } from '@/components/pos/MixedPaymentDialog';
import { DiscountDialog } from '@/components/pos/DiscountDialog';
import { CustomerDialog } from '@/components/pos/CustomerDialog';
import { CustomerCreditDialog } from '@/components/pos/CustomerCreditDialog';
import { SavedCartsDialog } from '@/components/pos/SavedCartsDialog';
import { WeightInputDialog } from '@/components/pos/WeightInputDialog';
import { ZeroPriceDialog } from '@/components/pos/ZeroPriceDialog';
import { OpenDayDialog } from '@/components/pos/OpenDayDialog';
import { CloseDayDialog } from '@/components/pos/CloseDayDialog';
import { ReportXDialog } from '@/components/pos/ReportXDialog';
import { RefundDialog } from '@/components/pos/RefundDialog';
import { Receipt } from '@/components/pos/Receipt';
import { RemoteScanDialog } from '@/components/pos/RemoteScanDialog';
import { PriceEditDialog } from '@/components/pos/PriceEditDialog';
import { useTodayReport, getTodayReportData, type ReportData } from '@/hooks/useDailyReports';
import { getSpecialPriceForCustomer } from '@/hooks/useCustomerSpecialPrices';
import { useActivePromotions, calculateDiscount } from '@/hooks/usePromotions';
import { useCartPersistence } from '@/hooks/useCartPersistence';
import type { CartItem as SaleCartItem } from '@/types/pos';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
  custom_price?: number;
  discount?: {
    type: DiscountType;
    value: number;
  };
  is_gift?: boolean;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export default function MobilePOS() {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: customers = [] } = useCustomers();
  const { data: activePromotions } = useActivePromotions();
  const { data: todayReport } = useTodayReport();
  const { user } = useAuth();
  const createSale = useCreateSale();
  
  // Persistance
  const { loadCart, saveCart, loadCustomer, saveCustomer, loadInvoiceMode, saveInvoiceMode } = useCartPersistence();
  
  // États principaux
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => loadCustomer());
  const [isInvoiceMode, setIsInvoiceMode] = useState(() => loadInvoiceMode());
  const [scannerOpen, setScannerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'products' | 'cart'>('products');
  
  // Dialogs
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [mixedPaymentDialogOpen, setMixedPaymentDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [savedCartsDialogOpen, setSavedCartsDialogOpen] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [openDayDialogOpen, setOpenDayDialogOpen] = useState(false);
  const [closeDayDialogOpen, setCloseDayDialogOpen] = useState(false);
  const [reportXDialogOpen, setReportXDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [remoteScanDialogOpen, setRemoteScanDialogOpen] = useState(false);
  
  // États temporaires
  const [discountTarget, setDiscountTarget] = useState<{ type: 'item' | 'global', index?: number } | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<{ type: DiscountType, value: number } | null>(null);
  const [appliedAutoPromotion, setAppliedAutoPromotion] = useState<any>(null);
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [tempPrice, setTempPrice] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  // Zero price dialog
  const [zeroPriceDialogOpen, setZeroPriceDialogOpen] = useState(false);
  const [zeroPriceProduct, setZeroPriceProduct] = useState<Product | null>(null);
  const [zeroPriceQuantity, setZeroPriceQuantity] = useState<number>(1);
  
  // Report data
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalCash: 0,
    totalCard: 0,
    totalMobile: 0,
    salesCount: 0,
    vatByRate: {},
  });

  // Scanner physique automatique
  useUnifiedScanner({
    onScan: async (barcode, product) => {
      if (product) {
        await handleProductSelect(product);
      } else {
        toast.error(`Produit non trouvé: ${barcode}`);
      }
    },
    enabled: !scannerOpen && viewMode === 'products',
    cooldown: 1000,
  });

  // Persistance
  useEffect(() => {
    saveCart(cart);
  }, [cart, saveCart]);

  useEffect(() => {
    saveCustomer(selectedCustomer);
  }, [selectedCustomer, saveCustomer]);

  useEffect(() => {
    saveInvoiceMode(isInvoiceMode);
  }, [isInvoiceMode, saveInvoiceMode]);

  // Mise à jour des prix spéciaux client
  useEffect(() => {
    const updateCartPrices = async () => {
      if (cart.length === 0) return;

      const updatedCart = await Promise.all(
        cart.map(async (item) => {
          let customPrice: number | undefined;
          
          if (selectedCustomer) {
            const specialPrice = await getSpecialPriceForCustomer(selectedCustomer.id, item.product.id);
            if (specialPrice !== null) {
              customPrice = specialPrice;
            }
          }
          
          const totals = calculateItemTotal(item.product, item.quantity, item.discount, customPrice, item.is_gift);
          
          return {
            ...item,
            custom_price: customPrice,
            ...totals
          };
        })
      );

      setCart(updatedCart);
    };

    updateCartPrices();
  }, [selectedCustomer]);

  // Calcul des promotions automatiques
  useEffect(() => {
    if (activePromotions && cart.length > 0) {
      const customerType = selectedCustomer?.vat_number ? 'professional' : 'individual';
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

  // Chargement des données du rapport
  useEffect(() => {
    const loadReportData = async () => {
      try {
        const data = await getTodayReportData();
        setReportData(data);
      } catch (error) {
        console.error('Erreur chargement rapport:', error);
      }
    };
    
    loadReportData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadReportData, 30000);
    return () => clearInterval(interval);
  }, [todayReport]);

  // Calcul du total d'un article
  const calculateItemTotal = (
    product: Product, 
    quantity: number, 
    discount?: CartItem['discount'], 
    customPrice?: number,
    isGift?: boolean
  ) => {
    if (!product || quantity <= 0) {
      return { subtotal: 0, vatAmount: 0, total: 0 };
    }
    
    const unitPriceTTC = customPrice ?? product.price;
    const vatRate = product.vat_rate || 0;
    const unitPriceHT = unitPriceTTC / (1 + vatRate / 100);
    const subtotal = unitPriceHT * quantity;
    const vatAmount = subtotal * (vatRate / 100);
    
    let discountAmount = 0;
    if (discount) {
      const totalTTC = unitPriceTTC * quantity;
      discountAmount = discount.type === 'percentage' 
        ? totalTTC * discount.value / 100 
        : discount.value;
    }
    
    const total = isGift ? 0 : Math.max(0, unitPriceTTC * quantity - discountAmount);
    
    return {
      subtotal: isGift ? 0 : Math.max(0, subtotal),
      vatAmount: isGift ? 0 : Math.max(0, vatAmount),
      total: Math.max(0, total)
    };
  };

  // Sélection de produit
  const handleProductSelect = useCallback(async (product: Product, quantityOverride?: number) => {
    if (!product || !product.id) {
      toast.error('Produit invalide');
      return;
    }
    
    if (!todayReport) {
      toast.error('Veuillez ouvrir la journée');
      setOpenDayDialogOpen(true);
      return;
    }
    
    const qty = quantityOverride || 1;
    
    // Si le prix est 0, ouvrir le dialog de saisie du prix
    if (product.price === 0 || product.price === null) {
      setZeroPriceProduct(product);
      setZeroPriceQuantity(qty);
      setZeroPriceDialogOpen(true);
      return;
    }
    
    if (product.type === 'weight') {
      setWeightProduct(product);
      setWeightDialogOpen(true);
      return;
    }
    
    let specialPrice: number | undefined;
    if (selectedCustomer) {
      const priceFromDB = await getSpecialPriceForCustomer(selectedCustomer.id, product.id);
      if (priceFromDB !== null) {
        specialPrice = priceFromDB;
      }
    }
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        const existing = newCart[existingIndex];
        const newQuantity = existing.quantity + qty;
        const customPrice = specialPrice ?? existing.custom_price;
        const totals = calculateItemTotal(product, newQuantity, existing.discount, customPrice, existing.is_gift);
        newCart[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          custom_price: customPrice,
          ...totals
        };
        return newCart;
      } else {
        const totals = calculateItemTotal(product, qty, undefined, specialPrice);
        return [...prevCart, {
          product,
          quantity: qty,
          custom_price: specialPrice,
          ...totals
        }];
      }
    });
    
    if (specialPrice) {
      toast.success(`${product.name} - Prix spécial: ${specialPrice.toFixed(2)}€`);
    } else {
      toast.success(`${product.name} ajouté`);
    }
    
    // Basculer vers le panier après ajout
    if (viewMode === 'products') {
      setViewMode('cart');
    }
  }, [todayReport, selectedCustomer, viewMode]);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.barcode?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [products, selectedCategory, search]);

  // Calcul des totaux
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = cart.reduce((sum, item) => sum + item.vatAmount, 0);
    const itemDiscounts = cart.reduce((sum, item) => {
      if (item.discount) {
        const discountAmount = item.discount.type === 'percentage' 
          ? item.subtotal * item.discount.value / 100 
          : item.discount.value;
        return sum + discountAmount;
      }
      return sum;
    }, 0);
    
    let total = cart.reduce((sum, item) => sum + item.total, 0);
    let globalDiscountAmount = 0;
    let autoPromotionAmount = 0;
    
    if (globalDiscount) {
      globalDiscountAmount = globalDiscount.type === 'percentage' 
        ? total * globalDiscount.value / 100 
        : globalDiscount.value;
      total -= globalDiscountAmount;
    }
    
    if (appliedAutoPromotion && cart.length > 0) {
      const customerType = selectedCustomer?.vat_number ? 'professional' : 'individual';
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
    
    const totalDiscount = itemDiscounts + globalDiscountAmount + autoPromotionAmount;
    
    return {
      subtotal,
      totalVat,
      totalDiscount,
      total: Math.max(0, total),
      autoPromotionAmount
    };
  }, [cart, globalDiscount, appliedAutoPromotion, selectedCustomer]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Actions
  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQuantity = Math.max(0.01, item.quantity + delta);
      const totals = calculateItemTotal(item.product, newQuantity, item.discount, item.custom_price, item.is_gift);
      newCart[index] = { ...item, quantity: newQuantity, ...totals };
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.info('Article retiré');
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscount(null);
    setAppliedAutoPromotion(null);
    toast.info('Panier vidé');
  };

  const handleWeightConfirm = (weight: number) => {
    if (!weightProduct) return;
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === weightProduct.id);
      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        const existing = newCart[existingIndex];
        const newQuantity = existing.quantity + weight;
        const totals = calculateItemTotal(weightProduct, newQuantity, existing.discount, existing.custom_price);
        newCart[existingIndex] = { ...existing, quantity: newQuantity, ...totals };
        return newCart;
      } else {
        const totals = calculateItemTotal(weightProduct, weight);
        return [...prevCart, { product: weightProduct, quantity: weight, ...totals }];
      }
    });
    
    toast.success(`${weightProduct.name} ajouté (${weight} kg)`);
    setWeightDialogOpen(false);
  };

  // Handler pour confirmer un prix saisi (produit sans prix)
  const handleZeroPriceConfirm = (price: number) => {
    if (!zeroPriceProduct) return;
    
    // Mettre à jour le produit avec le nouveau prix
    const updatedProduct = { ...zeroPriceProduct, price };
    
    // Vérifier si c'est un produit au poids
    if (updatedProduct.type === 'weight') {
      setWeightProduct(updatedProduct);
      setWeightDialogOpen(true);
      return;
    }
    
    const qty = zeroPriceQuantity || 1;
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === updatedProduct.id);
      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        const existing = newCart[existingIndex];
        const newQuantity = existing.quantity + qty;
        const totals = calculateItemTotal(updatedProduct, newQuantity, existing.discount, price);
        newCart[existingIndex] = {
          ...existing,
          product: updatedProduct,
          quantity: newQuantity,
          custom_price: price,
          ...totals
        };
        return newCart;
      } else {
        const totals = calculateItemTotal(updatedProduct, qty, undefined, price);
        return [...prevCart, {
          product: updatedProduct,
          quantity: qty,
          custom_price: price,
          ...totals
        }];
      }
    });
    
    toast.success(`${updatedProduct.name} ajouté (${price.toFixed(2)}€)`);
    setViewMode('cart');
  };

  const handleDiscount = (index?: number) => {
    setDiscountTarget(index !== undefined ? { type: 'item', index } : { type: 'global' });
    setDiscountDialogOpen(true);
  };

  const handleDiscountApply = (type: DiscountType, value: number) => {
    if (discountTarget?.type === 'item' && discountTarget.index !== undefined) {
      const index = discountTarget.index;
      setCart(prev => {
        const newCart = [...prev];
        const item = newCart[index];
        const discount = { type, value };
        const totals = calculateItemTotal(item.product, item.quantity, discount, item.custom_price, item.is_gift);
        newCart[index] = { ...item, discount, ...totals };
        return newCart;
      });
      toast.success('Remise article appliquée');
    } else {
      setGlobalDiscount({ type, value });
      toast.success('Remise globale appliquée');
    }
    setDiscountDialogOpen(false);
  };

  const handleToggleGift = (index: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const isGift = !item.is_gift;
      const totals = calculateItemTotal(item.product, item.quantity, item.discount, item.custom_price, isGift);
      newCart[index] = { ...item, is_gift: isGift, ...totals };
      return newCart;
    });
    toast.success(cart[index].is_gift ? 'Article non offert' : 'Article offert');
  };

  const handlePaymentComplete = async (paymentData: any) => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    const saleItems = cart.map(item => ({
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
    }));

    createSale.mutate({
      sale: {
        items: saleItems,
        payment_method: paymentData.method,
        payment_methods: paymentData.methods,
        payment_split: paymentData.split,
        amount_paid: paymentData.amountPaid || totals.total,
        change_amount: paymentData.change || 0,
        is_invoice: isInvoiceMode,
        is_cancelled: false,
        customer_id: selectedCustomer?.id,
        cashier_id: user?.id,
        subtotal: totals.subtotal,
        total_vat: totals.totalVat,
        total_discount: totals.totalDiscount,
        total: totals.total,
        notes: 'Vente mobile',
        source: 'mobile',
      } as any,
      forceStockOverride: false,
    }, {
      onSuccess: (data) => {
        setCurrentSale(data);
        setReceiptDialogOpen(true);
        clearCart();
        setSelectedCustomer(null);
        setIsInvoiceMode(false);
        toast.success('Vente enregistrée');
      },
      onError: (error) => {
        console.error('Erreur vente:', error);
        toast.error('Erreur lors de la vente');
      }
    });
  };

  const handleQuickPayment = (method: 'cash' | 'card' | 'mobile') => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    handlePaymentComplete({
      method,
      methods: [method],
      amountPaid: totals.total,
      change: 0
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone?.includes(customerSearchTerm)
  );

  return (
    <MobileLayout 
      title="Caisse"
      showBack={true}
      actions={
        <Button size="sm" variant="outline" onClick={() => setMenuOpen(true)}>
          <Grid3X3 className="h-4 w-4" />
        </Button>
      }
    >
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        
        {/* Barre info */}
        <div className="p-2 border-b bg-muted/30 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            {selectedCustomer && (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                {selectedCustomer.name}
              </Badge>
            )}
            {isInvoiceMode && (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                Facture
              </Badge>
            )}
            {globalDiscount && (
              <Badge variant="destructive" className="gap-1">
                <Percent className="h-3 w-3" />
                Remise globale
              </Badge>
            )}
            {appliedAutoPromotion && (
              <Badge variant="default" className="gap-1">
                <Tag className="h-3 w-3" />
                Promo auto
              </Badge>
            )}
          </div>
        </div>

        {/* Toggle Vue */}
        <div className="p-2 border-b flex gap-2">
          <Button
            variant={viewMode === 'products' ? 'default' : 'outline'}
            className="flex-1"
            size="sm"
            onClick={() => setViewMode('products')}
          >
            <Package className="h-4 w-4 mr-1" />
            Produits
          </Button>
          <Button
            variant={viewMode === 'cart' ? 'default' : 'outline'}
            className="flex-1"
            size="sm"
            onClick={() => setViewMode('cart')}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Panier ({totalItems})
          </Button>
        </div>

        {/* Contenu */}
        {viewMode === 'products' ? (
          <>
            {/* Recherche */}
            <div className="p-3 border-b">
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                >
                  <Scan className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setRemoteScanDialogOpen(true)}
                  title="QR Scan Mobile"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>

              {/* Catégories */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  <Button
                    size="sm"
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Tous
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat.id}
                      size="sm"
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Liste produits */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {filteredProducts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Aucun produit</p>
                  </Card>
                ) : (
                  filteredProducts.map(product => (
                    <Card 
                      key={product.id}
                      className="p-3 cursor-pointer hover:bg-accent"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">
                              {product.price.toFixed(2)}€
                            </span>
                            {product.stock !== undefined && (
                              <Badge variant={product.stock === 0 ? 'destructive' : 'secondary'} className="text-xs">
                                Stock: {product.stock}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button size="icon" variant="default">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          // Vue panier
          <div className="flex flex-col flex-1">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-bold">Panier ({totalItems})</h3>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-1" />
                Vider
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {cart.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start gap-3 mb-2">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          {item.custom_price && (
                            <Badge variant="secondary" className="h-5 px-1 text-xs">Prix spécial</Badge>
                          )}
                          {item.discount && (
                            <Badge variant="destructive" className="h-5 px-1 text-xs">
                              -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                            </Badge>
                          )}
                          {item.is_gift && (
                            <Badge variant="default" className="h-5 px-1 text-xs">Offert</Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFromCart(index)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 min-w-[3rem]"
                          onClick={() => {
                            setEditingItemIndex(index);
                            setTempQuantity(item.quantity.toString());
                            setQuantityDialogOpen(true);
                          }}
                        >
                          {item.quantity}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 gap-1"
                          onClick={() => {
                            setEditingItemIndex(index);
                            setPriceDialogOpen(true);
                          }}
                        >
                          <Euro className="h-3 w-3" />
                          {(item.custom_price ?? item.product.price).toFixed(2)}€
                        </Button>
                        <span className="text-sm font-bold">=</span>
                        <span className="text-sm font-bold">{item.total.toFixed(2)}€</span>
                      </div>
                    </div>

                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={() => handleDiscount(index)}
                      >
                        <Percent className="h-3 w-3 mr-1" />
                        Remise
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={() => handleToggleGift(index)}
                      >
                        <Gift className="h-3 w-3 mr-1" />
                        {item.is_gift ? 'Annuler' : 'Offrir'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Totaux et paiement */}
            <div className="border-t bg-background">
              <div className="p-4 space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span>{totals.subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA</span>
                    <span>{totals.totalVat.toFixed(2)}€</span>
                  </div>
                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Remises</span>
                      <span>-{totals.totalDiscount.toFixed(2)}€</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {totals.total.toFixed(2)}€
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="lg"
                    className="h-12 bg-green-600 hover:bg-green-700"
                    onClick={() => handleQuickPayment('cash')}
                    disabled={cart.length === 0}
                  >
                    <Banknote className="h-5 w-5 mr-2" />
                    Espèces
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12"
                    onClick={() => handleQuickPayment('card')}
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Carte
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMixedPaymentDialogOpen(true)}
                    disabled={cart.length === 0}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Mixte
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreditDialogOpen(true)}
                    disabled={cart.length === 0 || !selectedCustomer}
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    Crédit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Menu latéral */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[80vw] sm:w-96">
          <SheetHeader>
            <SheetTitle>Menu Caisse</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-6rem)] mt-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setCustomerSearchOpen(true);
                  setMenuOpen(false);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                {selectedCustomer ? selectedCustomer.name : 'Sélectionner client'}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setIsInvoiceMode(!isInvoiceMode);
                  setMenuOpen(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isInvoiceMode ? 'Mode ticket' : 'Mode facture'}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  handleDiscount();
                  setMenuOpen(false);
                }}
              >
                <Percent className="h-4 w-4 mr-2" />
                Remise globale
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSavedCartsDialogOpen(true);
                  setMenuOpen(false);
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Paniers sauvegardés
              </Button>

              <Separator />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setRefundDialogOpen(true);
                  setMenuOpen(false);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Remboursement
              </Button>

              <Separator />

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setOpenDayDialogOpen(true);
                  setMenuOpen(false);
                }}
                disabled={!!todayReport}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ouvrir journée
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setReportXDialogOpen(true);
                  setMenuOpen(false);
                }}
                disabled={!todayReport}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Rapport X
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setCloseDayDialogOpen(true);
                  setMenuOpen(false);
                }}
                disabled={!todayReport}
              >
                <CalendarX className="h-4 w-4 mr-2" />
                Clôturer journée
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialog sélection client */}
      <Sheet open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Sélectionner un client</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Rechercher..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[calc(80vh-12rem)]">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchOpen(false);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Aucun client
                </Button>
                {filteredCustomers.map(customer => (
                  <Button
                    key={customer.id}
                    variant={selectedCustomer?.id === customer.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearchOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div>{customer.name}</div>
                      {customer.vat_number && (
                        <div className="text-xs text-muted-foreground">TVA: {customer.vat_number}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog quantité */}
      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la quantité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              step="0.01"
              value={tempQuantity}
              onChange={(e) => setTempQuantity(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => {
              if (editingItemIndex !== null) {
                const newQty = parseFloat(tempQuantity);
                if (!isNaN(newQty) && newQty > 0) {
                  setCart(prev => {
                    const newCart = [...prev];
                    const item = newCart[editingItemIndex];
                    const totals = calculateItemTotal(item.product, newQty, item.discount, item.custom_price, item.is_gift);
                    newCart[editingItemIndex] = { ...item, quantity: newQty, ...totals };
                    return newCart;
                  });
                }
              }
              setQuantityDialogOpen(false);
            }}>
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog prix avec HTVA/TVAC */}
      <PriceEditDialog
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
        currentPrice={editingItemIndex !== null ? (cart[editingItemIndex]?.custom_price ?? cart[editingItemIndex]?.product.price ?? 0) : 0}
        vatRate={editingItemIndex !== null ? (cart[editingItemIndex]?.product.vat_rate ?? 21) : 21}
        productName={editingItemIndex !== null ? (cart[editingItemIndex]?.product.name ?? '') : ''}
        onConfirm={(newPrice) => {
          if (editingItemIndex !== null) {
            setCart(prev => {
              const newCart = [...prev];
              const item = newCart[editingItemIndex];
              const totals = calculateItemTotal(item.product, item.quantity, item.discount, newPrice, item.is_gift);
              newCart[editingItemIndex] = { ...item, custom_price: newPrice, ...totals };
              return newCart;
            });
            toast.success('Prix modifié');
          }
        }}
      />

      {/* Scanner */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(product) => {
          handleProductSelect(product);
          setScannerOpen(false);
        }}
        onProductNotFound={(barcode) => {
          toast.error(`Produit non trouvé: ${barcode}`);
          setScannerOpen(false);
        }}
      />

      {/* Dialogs */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={totals.total}
        onConfirmPayment={(method, amountPaid, metadata) => {
          handlePaymentComplete({
            method,
            methods: [method],
            amountPaid: amountPaid || totals.total,
            change: metadata?.change || 0
          });
        }}
      />

      <MixedPaymentDialog
        open={mixedPaymentDialogOpen}
        onOpenChange={setMixedPaymentDialogOpen}
        total={totals.total}
        onConfirmPayment={(splits) => {
          const totalPaid = splits.reduce((sum, s) => sum + s.amount, 0);
          handlePaymentComplete({
            method: 'cash',
            methods: splits.map(s => s.method),
            split: splits,
            amountPaid: totalPaid,
            change: 0
          });
        }}
        customerId={selectedCustomer?.id}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        onApply={handleDiscountApply}
      />

      <CustomerCreditDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        customerId={selectedCustomer?.id || ''}
        customerName={selectedCustomer?.name || ''}
        totalAmount={totals.total}
        onApply={() => {
          handlePaymentComplete({
            method: 'customer_credit',
            methods: ['customer_credit'],
            amountPaid: totals.total,
            change: 0
          });
        }}
      />

      <SavedCartsDialog
        open={savedCartsDialogOpen}
        onOpenChange={setSavedCartsDialogOpen}
        currentCart={cart}
        onLoadCart={(loadedCart) => {
          setCart(loadedCart as CartItem[]);
          toast.success('Panier chargé');
        }}
      />

      <WeightInputDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        product={weightProduct}
        onConfirm={handleWeightConfirm}
      />

      <ZeroPriceDialog
        open={zeroPriceDialogOpen}
        onClose={() => setZeroPriceDialogOpen(false)}
        product={zeroPriceProduct}
        quantity={zeroPriceQuantity}
        onConfirm={handleZeroPriceConfirm}
      />

      <OpenDayDialog
        open={openDayDialogOpen}
        onOpenChange={setOpenDayDialogOpen}
        onConfirm={() => setOpenDayDialogOpen(false)}
      />

      <CloseDayDialog
        open={closeDayDialogOpen}
        onOpenChange={setCloseDayDialogOpen}
        onConfirm={() => setCloseDayDialogOpen(false)}
        reportData={reportData}
        todayReport={todayReport || null}
      />

      <ReportXDialog
        open={reportXDialogOpen}
        onOpenChange={setReportXDialogOpen}
        reportData={reportData}
        todayReport={todayReport || null}
      />

      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
      />

      {currentSale && receiptDialogOpen && (
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-md">
            <Receipt sale={currentSale} />
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Scan Mobile */}
      <RemoteScanDialog
        open={remoteScanDialogOpen}
        onOpenChange={setRemoteScanDialogOpen}
      />
    </MobileLayout>
  );
}
