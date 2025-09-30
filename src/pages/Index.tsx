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
import { CartDisplay } from '@/components/pos/CartDisplay';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { Receipt } from '@/components/pos/Receipt';
import { NumericKeypad } from '@/components/pos/NumericKeypad';
import { CartItem, Product, PaymentMethod, Sale, DiscountType } from '@/types/pos';
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

  const totals = getTotals();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Caisse Enregistreuse</h1>
                <p className="text-sm opacity-90">GUL REYHAN</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="icon">
                <Package className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon">
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Product Search & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Recherche de produits</h2>
              <ProductSearch onProductSelect={handleProductSelect} />
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Actions rapides</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleClearCart}
                  disabled={cart.length === 0}
                  className="h-20 flex flex-col gap-2"
                >
                  <XCircle className="h-6 w-6" />
                  <span>Vider le panier</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={cart.length === 0}
                  className="h-20 flex flex-col gap-2 bg-pos-success text-primary-foreground hover:bg-pos-success/90"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span>Payer ({totals.total.toFixed(2)}€)</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Cart */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <CartDisplay
                items={cart}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onApplyDiscount={handleApplyDiscount}
              />
            </div>
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
