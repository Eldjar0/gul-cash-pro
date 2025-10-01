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
    <div className="min-h-screen flex flex-col bg-[#1a1a1a]">
      {/* Barre d'état supérieure - Style terminal */}
      <div className="bg-[#0a0a0a] border-b-2 border-pos-success/30 px-6 py-2">
        <div className="flex items-center justify-between text-pos-success font-mono">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-bold">CAISSE #1</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{currentTime.toLocaleTimeString('fr-FR')}</span>
            </div>
            <div className="text-sm">{currentTime.toLocaleDateString('fr-FR')}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-pos-success hover:bg-pos-success/10 font-mono"
          >
            <LogOut className="h-4 w-4 mr-2" />
            QUITTER
          </Button>
        </div>
      </div>

      {/* Contenu principal - 3 colonnes */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* COLONNE GAUCHE - Catégories & PLU */}
        <div className="col-span-3 bg-[#252525] border-r-2 border-[#333] p-4 overflow-auto">
          <div className="mb-4">
            <h2 className="text-white font-bold text-lg mb-3 font-mono">CATÉGORIES</h2>
            <CategoryGrid onProductSelect={handleProductSelect} />
          </div>
        </div>

        {/* COLONNE CENTRE - Scan & Recherche */}
        <div className="col-span-5 bg-[#1a1a1a] p-4 flex flex-col gap-4">
          {/* Zone de scan */}
          <Card className="bg-[#0a0a0a] border-2 border-pos-success/30 p-6">
            <form onSubmit={handleScanSubmit}>
              <div className="flex items-center gap-3 mb-4">
                <Scan className="h-8 w-8 text-pos-success animate-pulse" />
                <div className="flex-1">
                  <label className="text-pos-success text-sm font-mono mb-2 block">SCANNER / CODE BARRE</label>
                  <Input
                    ref={scanInputRef}
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scanner un article..."
                    className="h-12 bg-[#1a1a1a] border-pos-success/50 text-white text-xl font-mono focus:border-pos-success"
                  />
                </div>
              </div>
            </form>
          </Card>

          {/* Clavier numérique XXL */}
          <Card className="bg-[#0a0a0a] border-2 border-[#333] p-4">
            <div className="text-pos-success text-sm font-mono mb-3">QUANTITÉ</div>
            <div className="bg-[#1a1a1a] p-4 rounded mb-4 border border-pos-success/30">
              <div className="text-pos-success text-4xl font-mono text-center font-bold">
                {quantityInput}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => key === 'C' ? handleClearQuantity() : handleNumberClick(key)}
                  className="h-16 text-2xl font-bold bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-[#444] font-mono"
                >
                  {key}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* COLONNE DROITE - Ticket & Paiement */}
        <div className="col-span-4 bg-[#0a0a0a] border-l-2 border-[#333] flex flex-col">
          {/* En-tête du ticket */}
          <div className="bg-[#1a1a1a] border-b-2 border-pos-success/30 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-pos-success font-bold text-xl font-mono">TICKET DE CAISSE</h2>
              <div className="text-pos-success font-mono">
                <span className="text-sm">ARTICLES: </span>
                <span className="text-xl font-bold">{totalItems}</span>
              </div>
            </div>
          </div>

          {/* Liste des articles */}
          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <Scan className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500 font-mono">Aucun article scanné</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#1a1a1a] border border-[#333] p-3 rounded font-mono"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-white font-bold text-sm">{item.product.name}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          {item.product.price.toFixed(2)}€ × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-8 w-8 hover:bg-destructive/20 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, Math.max(0.1, item.quantity - 1))}
                          className="h-7 w-7 p-0 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-[#444]"
                        >
                          -
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="h-7 w-7 p-0 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-[#444]"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-pos-success text-lg font-bold">
                        {item.total.toFixed(2)}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Totaux */}
          <div className="bg-[#1a1a1a] border-t-2 border-pos-success/30 p-4 space-y-2">
            <div className="flex justify-between text-gray-400 font-mono">
              <span>Sous-total HT:</span>
              <span>{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-gray-400 font-mono">
              <span>TVA:</span>
              <span>{totals.totalVat.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-pos-success text-3xl font-bold font-mono pt-3 border-t-2 border-[#333]">
              <span>TOTAL:</span>
              <span>{totals.total.toFixed(2)}€</span>
            </div>
          </div>

          {/* Boutons de paiement */}
          <div className="bg-[#0a0a0a] p-4 space-y-3 border-t-2 border-[#333]">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="h-16 bg-destructive hover:bg-destructive/90 text-white font-bold text-lg font-mono"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                ANNULER
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-16 bg-pos-success hover:bg-pos-success/90 text-black font-bold text-lg font-mono"
              >
                <DollarSign className="mr-2 h-5 w-5" />
                PAYER
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-12 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-category-blue font-mono"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                CB
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-12 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-category-green font-mono"
              >
                <Banknote className="mr-2 h-4 w-4" />
                ESP
              </Button>
              <Button
                onClick={() => setPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="h-12 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-category-purple font-mono"
              >
                <Smartphone className="mr-2 h-4 w-4" />
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
