import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  BarChart3,
  Settings,
  Package,
  Printer,
  XCircle,
  LogOut,
} from 'lucide-react';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CategoryGrid } from '@/components/pos/CategoryGrid';
import { CartDisplay } from '@/components/pos/CartDisplay';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { Receipt } from '@/components/pos/Receipt';
import { QuickCalculator } from '@/components/pos/QuickCalculator';
import { CashDrawerActions } from '@/components/pos/CashDrawerActions';
import { NumericKeypad } from '@/components/pos/NumericKeypad';
import { Product, useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSale } from '@/hooks/useSales';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
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
  const createSale = useCreateSale();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [weightInput, setWeightInput] = useState('');
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  const calculateItemTotal = (product: Product, quantity: number, discount?: CartItem['discount']) => {
    const subtotal = product.price * quantity;
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

  const handleProductSelect = (product: Product, quantity?: number) => {
    if (product.type === 'weight' && !quantity) {
      setSelectedProduct(product);
      setWeightInput('');
      setWeightDialogOpen(true);
      return;
    }

    const qty = quantity || 1;
    const { subtotal, vatAmount, total } = calculateItemTotal(product, qty);

    const newItem: CartItem = {
      product,
      quantity: qty,
      subtotal,
      vatAmount,
      total,
    };

    setCart([...cart, newItem]);
    toast.success(`${product.name} ajouté`);
  };

  const handleWeightConfirm = () => {
    if (selectedProduct && weightInput) {
      const weight = parseFloat(weightInput);
      if (weight > 0) {
        handleProductSelect(selectedProduct, weight);
        setWeightDialogOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.info('Article retiré');
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const { subtotal, vatAmount, total } = calculateItemTotal(item.product, quantity, item.discount);
    
    newCart[index] = {
      ...item,
      quantity,
      subtotal,
      vatAmount,
      total,
    };
    
    setCart(newCart);
  };

  const handleApplyDiscount = (index: number) => {
    setSelectedItemIndex(index);
    setDiscountValue('');
    setDiscountType('percentage');
    setDiscountDialogOpen(true);
  };

  const confirmDiscount = () => {
    if (selectedItemIndex !== null && discountValue) {
      const value = parseFloat(discountValue);
      if (value > 0) {
        const newCart = [...cart];
        const item = newCart[selectedItemIndex];
        
        const discount = { type: discountType, value };
        const { subtotal, vatAmount, total } = calculateItemTotal(item.product, item.quantity, discount);
        
        newCart[selectedItemIndex] = {
          ...item,
          discount,
          subtotal,
          vatAmount,
          total,
        };
        
        setCart(newCart);
        setDiscountDialogOpen(false);
        toast.success('Remise appliquée');
      }
    }
  };

  const getTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = cart.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalDiscount = cart.reduce((sum, item) => {
      if (item.discount) {
        const discountAmount =
          item.discount.type === 'percentage'
            ? (item.subtotal * item.discount.value) / 100
            : item.discount.value;
        return sum + discountAmount;
      }
      return sum;
    }, 0);
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, totalVat, totalDiscount, total };
  };

  const handleConfirmPayment = async (method: 'cash' | 'card' | 'mobile', amountPaid?: number) => {
    const totals = getTotals();
    
    const saleData = {
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total_discount: totals.totalDiscount,
      total: totals.total,
      payment_method: method,
      amount_paid: amountPaid,
      change_amount: amountPaid ? amountPaid - totals.total : 0,
      is_invoice: false,
      is_cancelled: false,
      cashier_id: user.id,
      items: cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_barcode: item.product.barcode,
        quantity: item.quantity,
        unit_price: item.product.price,
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
      setCurrentSale(sale);
      setCart([]);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
      toast.success('Paiement réussi!');
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Erreur lors du paiement');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      toast.info('Panier vidé');
    }
  };

  const handleProductCode = (code: string) => {
    const product = products?.find(
      (p) => p.barcode === code || p.id === code
    );
    if (product) {
      handleProductSelect(product, product.type === 'unit' ? 1 : undefined);
    } else {
      toast.error(`Produit non trouvé: ${code}`);
    }
  };

  const handleCreateProduct = () => {
    toast.info('Création de produit - À venir');
  };

  const handleOpenDrawer = () => {
    toast.success('💰 Caisse ouverte');
  };

  const handleViewStats = () => {
    toast.info('📊 Statistiques - À venir');
  };

  const handleViewHistory = () => {
    toast.info('📋 Historique - À venir');
  };

  const handleManageCustomers = () => {
    toast.info('👥 Gestion clients - À venir');
  };

  const handleManageProducts = () => {
    toast.info('📦 Gestion produits - À venir');
  };

  const handleSettings = () => {
    toast.info('⚙️ Paramètres - À venir');
  };

  const totals = getTotals();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header */}
      <header className="relative overflow-hidden border-b border-border/50 shadow-xl">
        <div className="absolute inset-0 bg-[var(--gradient-primary)]"></div>
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Point de Vente</h1>
                <p className="text-sm text-white/90 font-medium">Système moderne</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <div className="text-sm font-bold text-white">Caisse #1</div>
                <div className="text-xs text-white/80">{new Date().toLocaleDateString('fr-BE')}</div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                <Package className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="h-11 w-11 rounded-xl bg-white/10 hover:bg-destructive text-white border border-white/20 backdrop-blur-sm"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-6 h-full">
          {/* Left Column - Cart */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex-1 min-h-0">
              <CartDisplay
                items={cart}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onApplyDiscount={handleApplyDiscount}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleClearCart}
                variant="outline"
                disabled={cart.length === 0}
                className="h-16 bg-gradient-to-br from-destructive to-destructive/80 text-white hover:scale-105 active:scale-95 border-0 font-bold shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Annuler
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-16 bg-gradient-to-br from-pos-success to-category-green text-white hover:scale-105 active:scale-95 border-0 font-bold text-lg shadow-lg hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <Printer className="mr-2 h-5 w-5 relative z-10" />
                <span className="relative z-10">Payer</span>
              </Button>
            </div>
          </div>

          {/* Right Column - Products */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
            {/* Search Bar */}
            <Card className="p-4 shadow-xl glass border-2 border-primary/20">
              <ProductSearch onProductSelect={handleProductSelect} />
            </Card>

            {/* Quick Tools */}
            <div className="grid grid-cols-2 gap-3">
              <QuickCalculator
                onProductCode={handleProductCode}
                onCreateProduct={handleCreateProduct}
              />
              <CashDrawerActions
                onOpenDrawer={handleOpenDrawer}
                onViewStats={handleViewStats}
                onViewHistory={handleViewHistory}
                onManageCustomers={handleManageCustomers}
                onManageProducts={handleManageProducts}
                onSettings={handleSettings}
              />
            </div>

            {/* Categories - Main Product Area */}
            <Card className="flex-1 p-6 overflow-auto glass border-2 border-border/50 shadow-xl min-h-0">
              <CategoryGrid onProductSelect={handleProductSelect} />
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={totals.total}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md glass border-2 border-primary/30">
          <DialogHeader>
            <DialogTitle className="gradient-text">Ticket de caisse</DialogTitle>
          </DialogHeader>
          {currentSale && (
            <Receipt 
              sale={{
                ...currentSale,
                items: cart.map(item => ({
                  product: item.product,
                  quantity: item.quantity,
                  discount: item.discount,
                  subtotal: item.subtotal,
                  vatAmount: item.vatAmount,
                  total: item.total,
                })),
              }} 
            />
          )}
          <div className="flex gap-3">
            <Button onClick={handlePrint} className="flex-1 bg-gradient-to-r from-primary to-secondary">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)} className="flex-1">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="glass border-2 border-primary/30">
          <DialogHeader>
            <DialogTitle className="gradient-text">Appliquer une remise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDiscountType('percentage')}
                className="flex-1"
              >
                Pourcentage (%)
              </Button>
              <Button
                variant={discountType === 'amount' ? 'default' : 'outline'}
                onClick={() => setDiscountType('amount')}
                className="flex-1"
              >
                Montant (€)
              </Button>
            </div>
            <div>
              <Label>Valeur de la remise</Label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '10' : '5.00'}
                step="0.01"
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDiscountDialogOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={confirmDiscount} className="flex-1 bg-gradient-to-r from-accent to-accent/80">
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weight Input Dialog */}
      <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
        <DialogContent className="glass border-2 border-primary/30">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              Poids - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--gradient-display)]"></div>
              <div className="relative p-6">
                <div className="text-sm text-white/70 mb-2">Poids (kg)</div>
                <div className="text-4xl font-bold text-white">
                  {weightInput || '0.000'}
                </div>
                {weightInput && selectedProduct && (
                  <div className="text-lg text-pos-success mt-2 font-bold">
                    Prix: {(parseFloat(weightInput) * selectedProduct.price).toFixed(2)}€
                  </div>
                )}
              </div>
            </Card>
            <NumericKeypad
              onNumberClick={(num) => setWeightInput((prev) => prev + num)}
              onClear={() => setWeightInput('')}
              onBackspace={() => setWeightInput((prev) => prev.slice(0, -1))}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setWeightDialogOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleWeightConfirm}
                disabled={!weightInput || parseFloat(weightInput) <= 0}
                className="flex-1 bg-gradient-to-r from-pos-success to-category-green text-white disabled:opacity-50"
              >
                Valider
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
