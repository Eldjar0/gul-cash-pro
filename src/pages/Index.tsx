import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  BarChart3,
  Settings,
  Package,
  Printer,
  XCircle,
} from 'lucide-react';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CategoryGrid } from '@/components/pos/CategoryGrid';
import { CartDisplay } from '@/components/pos/CartDisplay';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { Receipt } from '@/components/pos/Receipt';
import { QuickCalculator } from '@/components/pos/QuickCalculator';
import { CashDrawerActions } from '@/components/pos/CashDrawerActions';
import { NumericKeypad } from '@/components/pos/NumericKeypad';
import { CartItem, Product, PaymentMethod, Sale, DiscountType } from '@/types/pos';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [weightInput, setWeightInput] = useState('');
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const calculateItemTotal = (product: Product, quantity: number, discount?: CartItem['discount']) => {
    const subtotal = product.price * quantity;
    const vatAmount = (subtotal * product.vat) / 100;
    
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
    toast.success(`${product.name} ajouté au panier`);
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
    toast.info('Article retiré du panier');
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

  const handleConfirmPayment = (method: PaymentMethod, amountPaid?: number) => {
    const totals = getTotals();
    
    const sale: Sale = {
      id: Date.now().toString(),
      saleNumber: `T${Date.now().toString().slice(-8)}`,
      date: new Date(),
      items: cart,
      ...totals,
      paymentMethod: method,
      amountPaid,
      change: amountPaid ? amountPaid - totals.total : undefined,
    };

    setCurrentSale(sale);
    setCart([]);
    setPaymentDialogOpen(false);
    setReceiptDialogOpen(true);
    toast.success('Vente enregistrée!');
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
    const product = MOCK_PRODUCTS.find(
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-secondary to-primary text-white shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Caisse GUL REYHAN</h1>
                <p className="text-xs opacity-80">Point de vente</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Caisse #1</div>
              <div className="text-xs opacity-80">{new Date().toLocaleDateString('fr-BE')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-3">
        <div className="grid lg:grid-cols-12 gap-3">
          {/* Left Column - Panier */}
          <div className="lg:col-span-5 space-y-3">
            <div className="h-[calc(100vh-200px)]">
              <CartDisplay
                items={cart}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onApplyDiscount={handleApplyDiscount}
              />
            </div>
            
            {/* Boutons d'action principaux */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="h-16 flex flex-col gap-1 hover:scale-105 transition-all shadow-lg hover:shadow-xl border-2 hover:border-destructive"
              >
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-bold text-sm">Vider</span>
              </Button>
              <Button
                size="lg"
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-16 flex flex-col gap-0.5 bg-gradient-to-br from-pos-success to-category-green text-white hover:scale-105 transition-all shadow-xl hover:shadow-2xl border-0"
              >
                <span className="font-bold text-sm">💳 PAYER</span>
                <span className="text-2xl font-black">{totals.total.toFixed(2)}€</span>
              </Button>
            </div>
          </div>

          {/* Right Column - Recherche, Calculatrice & Actions */}
          <div className="lg:col-span-7 space-y-3">
            {/* Calculatrice / Code produit */}
            <QuickCalculator
              onProductCode={handleProductCode}
              onCreateProduct={handleCreateProduct}
            />

            {/* Actions de caisse */}
            <CashDrawerActions
              onOpenDrawer={handleOpenDrawer}
              onViewStats={handleViewStats}
              onViewHistory={handleViewHistory}
              onManageCustomers={handleManageCustomers}
              onManageProducts={handleManageProducts}
              onSettings={handleSettings}
            />

            {/* Catégories de produits */}
            <Card className="p-4 shadow-xl border-2 border-primary/30">
              <CategoryGrid onProductSelect={handleProductSelect} />
            </Card>

            {/* Recherche rapide */}
            <Card className="p-4 shadow-xl border-2 border-secondary/30">
              <h2 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2">
                🔍 Recherche
              </h2>
              <ProductSearch onProductSelect={handleProductSelect} />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket de caisse</DialogTitle>
          </DialogHeader>
          {currentSale && <Receipt sale={currentSale} />}
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex-1">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appliquer une remise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
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
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDiscountDialogOpen(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={confirmDiscount} className="flex-1">
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weight Input Dialog */}
      <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Poids - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-pos-display p-6 rounded-lg">
              <div className="text-sm text-pos-display-foreground mb-2">Poids (kg)</div>
              <div className="text-4xl font-bold text-pos-display-foreground">
                {weightInput || '0.000'}
              </div>
              {weightInput && selectedProduct && (
                <div className="text-lg text-pos-display-foreground mt-2">
                  Prix: {(parseFloat(weightInput) * selectedProduct.price).toFixed(2)}€
                </div>
              )}
            </div>
            <NumericKeypad
              onNumberClick={(num) => setWeightInput((prev) => prev + num)}
              onClear={() => setWeightInput('')}
              onBackspace={() => setWeightInput((prev) => prev.slice(0, -1))}
            />
            <div className="flex gap-2">
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
                className="flex-1 bg-pos-success text-primary-foreground hover:bg-pos-success/90"
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
