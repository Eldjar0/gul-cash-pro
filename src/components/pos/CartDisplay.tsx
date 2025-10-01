import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Percent, Minus, Plus, ShoppingBag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Product } from '@/hooks/useProducts';

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

interface CartDisplayProps {
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onApplyDiscount: (index: number) => void;
}

export function CartDisplay({ items, onRemoveItem, onUpdateQuantity, onApplyDiscount }: CartDisplayProps) {
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalDiscount = items.reduce((sum, item) => {
      if (item.discount) {
        const discountAmount =
          item.discount.type === 'percentage'
            ? (item.subtotal * item.discount.value) / 100
            : item.discount.value;
        return sum + discountAmount;
      }
      return sum;
    }, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return { subtotal, totalVat, totalDiscount, total };
  };

  const totals = calculateTotals();

  return (
    <Card className="flex flex-col h-full overflow-hidden glass border-2 border-primary/20 shadow-xl">
      {/* Header with gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-primary)]"></div>
        <div className="relative p-4 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Panier</h2>
            <p className="text-xs text-white/80">{items.length} article{items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Panier vide</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Ajoutez des articles pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={index} className="p-3 bg-card hover:shadow-md transition-all duration-300 border border-border/50 group animate-scale-in">
                <div className="flex gap-3">
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{item.product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.product.price.toFixed(2)}€ × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                          {item.product.type === 'weight' && ' kg'}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onApplyDiscount(index)}
                          className="h-8 w-8 hover:bg-accent/10 hover:text-accent"
                        >
                          <Percent className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(index)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateQuantity(index, Math.max(0.001, item.quantity - (item.product.type === 'weight' ? 0.1 : 1)))}
                          className="h-7 w-7 hover:bg-background"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold min-w-10 text-center">
                          {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onUpdateQuantity(index, item.quantity + (item.product.type === 'weight' ? 0.1 : 1))}
                          className="h-7 w-7 hover:bg-background"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        {item.discount && (
                          <div className="text-xs text-muted-foreground line-through">
                            {item.subtotal.toFixed(2)}€
                          </div>
                        )}
                        <div className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          {item.total.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals */}
      <div className="relative overflow-hidden mt-auto">
        <div className="absolute inset-0 bg-[var(--gradient-display)]"></div>
        <div className="relative p-4 space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>Sous-total HT</span>
            <span className="font-medium text-white">{totals.subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm text-white/70">
            <span>TVA</span>
            <span className="font-medium text-white">{totals.totalVat.toFixed(2)}€</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-sm bg-accent/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="text-white font-medium">Remise</span>
              <span className="text-white font-bold">-{totals.totalDiscount.toFixed(2)}€</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold text-white pt-3 border-t border-white/20 mt-3">
            <span>TOTAL</span>
            <span className="text-pos-success">{totals.total.toFixed(2)}€</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
