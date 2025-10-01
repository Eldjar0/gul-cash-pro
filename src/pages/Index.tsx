import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Scan,
  CreditCard,
  Banknote,
  Trash2,
  DollarSign,
  LogOut,
  Clock,
  ShoppingBag,
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
  const [searchResults, setSearchResults] = useState<Product[]>([]);

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

  const handleSearch = () => {
    if (!scanInput.trim() || !products) {
      setSearchResults([]);
      return;
    }

    const searchTerm = scanInput.toLowerCase();
    const results = products.filter((p) => {
      return (
        p.barcode?.toLowerCase().includes(searchTerm) ||
        p.name.toLowerCase().includes(searchTerm) ||
        p.id.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    });

    if (results.length === 1) {
      // Si un seul résultat, l'ajouter directement
      handleProductSelect(results[0]);
      setScanInput('');
      setSearchResults([]);
    } else if (results.length > 1) {
      // Plusieurs résultats, les afficher
      setSearchResults(results);
    } else {
      toast.error(`Aucun produit trouvé`);
      setSearchResults([]);
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
      {/* Modern header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-bold tracking-tight">CAISSE #1</h1>
                <p className="text-xs text-white/80 hidden md:block">Point de Vente</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-white hover:bg-white/20 text-xs md:text-sm"
          >
            <LogOut className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Déconnexion</span>
          </Button>
        </div>
      </div>

      {/* Main content - Modern 3-column layout: TICKET | CALCULATRICE | ARTICLES */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT PANEL - Ticket à gauche */}
        <div className="lg:col-span-3 bg-white border-t lg:border-t-0 lg:border-r-2 border-border flex flex-col overflow-hidden shadow-xl">
          {/* Ticket header - Clean gradient */}
          <div className="bg-gradient-to-r from-primary to-primary-glow p-4 flex-shrink-0 shadow-lg">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="font-bold text-lg">Ticket</h2>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-sm font-bold">{totalItems} articles</span>
              </div>
            </div>
          </div>

          {/* Items list - Modern cards */}
          <ScrollArea className="flex-1 p-3 md:p-4 bg-background/50">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-muted/50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Panier vide</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Scannez ou sélectionnez un produit</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-border p-3 rounded-lg hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-bold text-sm truncate">{item.product.name}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          {item.product.price.toFixed(2)}€ × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8 hover:bg-destructive/20 text-destructive flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1.5 bg-muted/50 p-1 rounded-lg">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, Math.max(0.1, item.quantity - 1))}
                          className="h-7 w-7 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary"
                        >
                          -
                        </Button>
                        <div className="px-2 flex items-center justify-center min-w-[2rem] font-bold text-sm">
                          {item.quantity.toFixed(item.product.type === 'weight' ? 1 : 0)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="h-7 w-7 p-0 bg-white hover:bg-primary/10 text-foreground border border-border hover:border-primary"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-primary text-lg font-bold">
                        {item.total.toFixed(2)}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totals - Modern design */}
          <div className="bg-white border-t-2 border-border p-4 space-y-2 flex-shrink-0">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Sous-total HT</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>TVA</span>
              <span className="font-medium">{totals.totalVat.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center text-primary text-3xl font-bold pt-3 border-t-2 border-border">
              <span>TOTAL</span>
              <span>{totals.total.toFixed(2)}€</span>
            </div>
          </div>

          {/* Payment buttons - Modern SHOPCAISSE style */}
          <div className="bg-background p-3 md:p-4 space-y-3 border-t-2 border-border flex-shrink-0">
            <Button
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cart.length === 0}
              className="w-full h-14 md:h-16 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DollarSign className="mr-2 h-6 w-6" />
              PAYER {cart.length > 0 && `${totals.total.toFixed(2)}€`}
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-12 text-xs md:text-sm bg-white hover:bg-primary/5 text-primary border-2 border-primary font-semibold shadow-sm"
              >
                <CreditCard className="mr-1 h-4 w-4" />
                CB
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-12 text-xs md:text-sm bg-white hover:bg-accent/5 text-accent border-2 border-accent font-semibold shadow-sm"
              >
                <Banknote className="mr-1 h-4 w-4" />
                ESP
              </Button>
              <Button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="h-12 text-xs md:text-sm bg-white hover:bg-destructive/5 text-destructive border-2 border-destructive font-semibold shadow-sm"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                ANN
              </Button>
            </div>
          </div>
        </div>

        {/* COLONNE CENTRE - Calculatrice & Scan */}
        <div className="lg:col-span-6 bg-background p-2 md:p-4 flex flex-col gap-2 md:gap-4 overflow-y-auto lg:overflow-hidden">
          {/* Zone de scan */}
          <Card className="bg-white border border-border p-3 md:p-6 flex-shrink-0 shadow-sm">
            <form onSubmit={handleScanSubmit}>
              <div className="flex items-center gap-2 md:gap-3">
                <Scan className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-muted-foreground text-xs md:text-sm font-mono mb-1 md:mb-2 block">Rechercher produit</label>
                  <Input
                    ref={scanInputRef}
                    value={scanInput}
                    onChange={(e) => {
                      setScanInput(e.target.value);
                      if (!e.target.value.trim()) {
                        setSearchResults([]);
                      }
                    }}
                    placeholder="Code-barres, nom, catégorie..."
                    className="h-10 md:h-12 bg-background border-input text-foreground text-base md:text-xl font-mono focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 md:h-12 px-4 bg-primary hover:bg-primary/90 text-white"
                >
                  <Scan className="h-5 w-5" />
                </Button>
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

        {/* RIGHT PANEL - Articles/Catégories/Résultats */}
        <div className="hidden lg:block lg:col-span-3 bg-white border-l border-border overflow-y-auto">
          <div className="p-4">
            {searchResults.length > 0 ? (
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
