import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Scan,
  CreditCard,
  Banknote,
  Smartphone,
  Trash2,
  DollarSign,
  LogOut,
  Clock,
  User,
} from 'lucide-react';
import { CategoryGrid } from '@/components/pos/CategoryGrid';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { Receipt } from '@/components/pos/Receipt';
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
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [scanInput, setScanInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quantityInput, setQuantityInput] = useState('1');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [cart]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pos-display">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-success mx-auto mb-4"></div>
          <p className="text-white font-medium">Chargement...</p>
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
    const qty = quantity || parseFloat(quantityInput) || 1;
    const { subtotal, vatAmount, total } = calculateItemTotal(product, qty);

    const newItem: CartItem = {
      product,
      quantity: qty,
      subtotal,
      vatAmount,
      total,
    };

    setCart([...cart, newItem]);
    setQuantityInput('1');
    setScanInput('');
    toast.success(`${product.name} ajouté`);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const product = products?.find(
      (p) => p.barcode === scanInput || p.name.toLowerCase().includes(scanInput.toLowerCase())
    );

    if (product) {
      handleProductSelect(product);
    } else {
      toast.error(`Produit introuvable: ${scanInput}`);
      setScanInput('');
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
      toast.success('Paiement validé');
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Erreur paiement');
    }
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      toast.info('Panier vidé');
    }
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
      {/* Barre d'état supérieure */}
      <div className="bg-white border-b border-border px-3 md:px-6 py-2 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between text-foreground font-mono">
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm font-bold">CAISSE #1</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{currentTime.toLocaleTimeString('fr-FR')}</span>
            </div>
            <div className="hidden md:block text-sm">{currentTime.toLocaleDateString('fr-FR')}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-primary hover:bg-primary/10 font-mono text-xs md:text-sm"
          >
            <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
            <span className="hidden md:inline">QUITTER</span>
          </Button>
        </div>
      </div>

      {/* Contenu principal - Responsive layout */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 overflow-hidden">
        {/* COLONNE GAUCHE - Catégories (cachée sur mobile, visible sur desktop) */}
        <div className="hidden lg:block lg:col-span-3 bg-white border-r border-border overflow-y-auto">
          <div className="p-3 xl:p-4">
            <h2 className="text-foreground font-semibold text-base xl:text-lg mb-3">Catégories</h2>
            <CategoryGrid onProductSelect={handleProductSelect} />
          </div>
        </div>

        {/* COLONNE CENTRE - Scan & Clavier */}
        <div className="lg:col-span-5 bg-background p-2 md:p-4 flex flex-col gap-2 md:gap-4 overflow-y-auto lg:overflow-hidden">
          {/* Zone de scan */}
          <Card className="bg-white border border-border p-3 md:p-6 flex-shrink-0 shadow-sm">
            <form onSubmit={handleScanSubmit}>
              <div className="flex items-center gap-2 md:gap-3">
                <Scan className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-muted-foreground text-xs md:text-sm font-mono mb-1 md:mb-2 block">Scanner / Code barre</label>
                  <Input
                    ref={scanInputRef}
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scanner..."
                    className="h-10 md:h-12 bg-background border-input text-foreground text-base md:text-xl font-mono focus:border-primary"
                  />
                </div>
              </div>
            </form>
          </Card>

          {/* Catégories sur mobile */}
          <Card className="lg:hidden bg-white border border-border p-3 flex-1 overflow-y-auto shadow-sm">
            <h2 className="text-foreground font-semibold text-sm mb-2 font-mono">Catégories</h2>
            <CategoryGrid onProductSelect={handleProductSelect} />
          </Card>

          {/* Clavier numérique */}
          <Card className="hidden lg:block bg-white border border-border p-3 xl:p-4 flex-shrink-0 shadow-sm">
            <div className="text-muted-foreground text-xs md:text-sm font-mono mb-2 md:mb-3">Quantité</div>
            <div className="bg-muted p-2 md:p-4 rounded mb-2 md:mb-4 border border-border">
              <div className="text-primary text-2xl md:text-4xl font-mono text-center font-bold">
                {quantityInput}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => key === 'C' ? handleClearQuantity() : handleNumberClick(key)}
                  className="h-12 xl:h-16 text-lg xl:text-2xl font-bold bg-card hover:bg-muted text-foreground border-2 border-border font-mono transition-all active:scale-95 shadow-sm hover:shadow-md"
                >
                  {key}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* COLONNE DROITE - Ticket & Paiement */}
        <div className="lg:col-span-4 bg-white border-t lg:border-t-0 lg:border-l border-border flex flex-col overflow-hidden">
          {/* En-tête du ticket */}
          <div className="bg-muted/50 border-b-2 border-border p-3 md:p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-bold text-base md:text-xl font-mono">Ticket</h2>
              <div className="text-foreground font-mono">
                <span className="text-xs md:text-sm">ART: </span>
                <span className="text-lg md:text-xl font-bold">{totalItems}</span>
              </div>
            </div>
          </div>

          {/* Liste des articles */}
          <ScrollArea className="flex-1 p-2 md:p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Scan className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-mono text-sm">Aucun article</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border p-2 md:p-3 rounded font-mono hover:border-primary/50 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-bold text-xs md:text-sm truncate">{item.product.name}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          {item.product.price.toFixed(2)}€ × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-7 w-7 md:h-8 md:w-8 hover:bg-destructive/20 text-destructive flex-shrink-0 ml-2"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1 md:gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, Math.max(0.1, item.quantity - 1))}
                          className="h-6 w-6 md:h-7 md:w-7 p-0 bg-muted hover:bg-muted/80 text-foreground border border-border"
                        >
                          -
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="h-6 w-6 md:h-7 md:w-7 p-0 bg-muted hover:bg-muted/80 text-foreground border border-border"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-primary text-base md:text-lg font-bold">
                        {item.total.toFixed(2)}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totaux */}
          <div className="bg-muted/30 border-t-2 border-border p-3 md:p-4 space-y-1 md:space-y-2 flex-shrink-0">
            <div className="flex justify-between text-muted-foreground font-mono text-xs md:text-sm">
              <span>Sous-total HT:</span>
              <span>{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-mono text-xs md:text-sm">
              <span>TVA:</span>
              <span>{totals.totalVat.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-primary text-xl md:text-3xl font-bold font-mono pt-2 md:pt-3 border-t-2 border-border">
              <span>TOTAL:</span>
              <span>{totals.total.toFixed(2)}€</span>
            </div>
          </div>

          {/* Boutons de paiement */}
          <div className="bg-background p-2 md:p-4 space-y-2 md:space-y-3 border-t-2 border-border flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="h-12 md:h-16 bg-destructive hover:bg-destructive/90 text-white font-bold text-sm md:text-lg font-mono"
              >
                <Trash2 className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                ANNULER
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-12 md:h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-lg font-mono shadow-lg"
              >
                <DollarSign className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                PAYER
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-10 md:h-12 text-xs md:text-sm bg-card hover:bg-muted text-foreground border-2 border-primary font-mono shadow-sm"
              >
                <CreditCard className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                CB
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-10 md:h-12 text-xs md:text-sm bg-card hover:bg-muted text-foreground border-2 border-green-500 font-mono shadow-sm"
              >
                <Banknote className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                ESP
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-10 md:h-12 text-xs md:text-sm bg-card hover:bg-muted text-foreground border-2 border-purple-500 font-mono shadow-sm"
              >
                <Smartphone className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                SANS
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={totals.total}
        onConfirmPayment={handleConfirmPayment}
      />

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-2 border-pos-success/30">
          <DialogHeader>
            <DialogTitle className="text-pos-success font-mono">TICKET DE CAISSE</DialogTitle>
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
          <Button
            onClick={() => {
              setReceiptDialogOpen(false);
              window.print();
            }}
            className="w-full bg-pos-success hover:bg-pos-success/90 text-black font-bold font-mono"
          >
            IMPRIMER
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
