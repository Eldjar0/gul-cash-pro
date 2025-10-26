import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Smartphone, Scan } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import { useUnifiedScanner } from '@/hooks/useUnifiedScanner';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MobilePOS() {
  const { data: products = [] } = useProducts();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Scanner physique automatique
  useUnifiedScanner({
    onScan: (barcode, product) => {
      if (product) {
        addToCart(product);
      } else {
        toast.error(`Produit non trouvé: ${barcode}`);
      }
    },
    enabled: true,
    cooldown: 500,
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} ajouté`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: Math.max(0, newQuantity) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Panier vidé');
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePayment = (method: 'cash' | 'card' | 'mobile') => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    const methodLabels = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      mobile: 'Paiement mobile'
    };

    toast.success(`Paiement ${methodLabels[method]} de ${total.toFixed(2)}€ enregistré`);
    setCart([]);
  };

  return (
    <MobileLayout 
      title="Caisse"
      showBack={true}
    >
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        
        {/* Recherche produit */}
        <div className="p-3 border-b bg-background">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-10"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setScannerOpen(true)}
              className="shrink-0"
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-hidden">
          {cart.length === 0 ? (
            // Vue produits
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {filteredProducts.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Aucun produit trouvé</p>
                  </Card>
                ) : (
                  filteredProducts.map(product => (
                    <Card 
                      key={product.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
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
          ) : (
            // Vue panier
            <div className="flex flex-col h-full">
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Panier ({totalItems} article{totalItems > 1 ? 's' : ''})
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    Vider
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {cart.map(item => (
                    <Card key={item.product.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.product.price.toFixed(2)}€ × {item.quantity} = {(item.product.price * item.quantity).toFixed(2)}€
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t bg-background">
                <div className="p-4 space-y-3">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-3xl font-bold text-primary">
                      {total.toFixed(2)}€
                    </span>
                  </div>

                  <Separator />

                  {/* Méthodes de paiement */}
                  <div className="space-y-2">
                    <Button
                      size="lg"
                      className="w-full h-14 gap-3 bg-green-600 hover:bg-green-700"
                      onClick={() => handlePayment('cash')}
                    >
                      <Banknote className="h-5 w-5" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Espèces</div>
                        <div className="text-xs opacity-90">{total.toFixed(2)}€</div>
                      </div>
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-12 gap-2"
                        onClick={() => handlePayment('card')}
                      >
                        <CreditCard className="h-4 w-4" />
                        Carte
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-12 gap-2"
                        onClick={() => handlePayment('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                        Mobile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bouton panier fixe (visible quand on regarde les produits) */}
        {cart.length > 0 && (
          <div className="p-3 border-t bg-background">
            <Button
              size="lg"
              className="w-full gap-3 h-14"
              onClick={() => {}}
            >
              <ShoppingCart className="h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-semibold">Voir le panier ({totalItems})</div>
                <div className="text-xs opacity-90">{total.toFixed(2)}€</div>
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Scanner de codes-barres */}
      <MobileBarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductFound={(product) => {
          addToCart(product);
          setScannerOpen(false);
        }}
        onProductNotFound={(barcode) => {
          toast.error(`Produit non trouvé: ${barcode}`);
          setScannerOpen(false);
        }}
      />
    </MobileLayout>
  );
}
