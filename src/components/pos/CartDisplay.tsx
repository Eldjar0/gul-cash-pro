import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Percent, Minus, Plus } from 'lucide-react';
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
    <Card className="flex flex-col h-full bg-card shadow-xl border-2 border-primary/30">
      <div className="p-3 border-b bg-gradient-to-r from-primary to-secondary">
        <h2 className="text-lg font-bold text-white">🛒 Panier</h2>
      </div>

      <ScrollArea className="flex-1 p-3">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 text-sm">
            Aucun article
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <Card key={index} className="p-2 bg-muted/30 hover:bg-muted/40 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.product.price.toFixed(2)}€ × {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onApplyDiscount(index)}
                      className="h-7 w-7 hover:bg-pos-warning/20"
                    >
                      <Percent className="h-3 w-3 text-pos-warning" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(index)}
                      className="h-7 w-7 hover:bg-destructive/20"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onUpdateQuantity(index, Math.max(0.001, item.quantity - (item.product.type === 'weight' ? 0.1 : 1)))}
                      className="h-6 w-6 border-primary/30"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-medium min-w-8 text-center text-foreground px-1">
                      {item.quantity.toFixed(item.product.type === 'weight' ? 2 : 0)}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onUpdateQuantity(index, item.quantity + (item.product.type === 'weight' ? 0.1 : 1))}
                      className="h-6 w-6 border-primary/30"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    {item.discount && (
                      <div className="text-xs text-pos-warning line-through">
                        {item.subtotal.toFixed(2)}€
                      </div>
                    )}
                    <div className="font-bold text-base text-primary">{item.total.toFixed(2)}€</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t space-y-2 bg-gradient-to-br from-pos-display to-secondary shadow-inner">
        <div className="flex justify-between text-xs text-white/80">
          <span>Sous-total HT:</span>
          <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-xs text-white/80">
          <span>TVA:</span>
          <span className="font-medium">{totals.totalVat.toFixed(2)}€</span>
        </div>
        {totals.totalDiscount > 0 && (
          <div className="flex justify-between text-xs bg-pos-warning/20 px-2 py-1 rounded">
            <span className="text-white font-medium">🎉 Remise:</span>
            <span className="text-white font-bold">-{totals.totalDiscount.toFixed(2)}€</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/30">
          <span>TOTAL:</span>
          <span className="text-2xl text-pos-success">{totals.total.toFixed(2)}€</span>
        </div>
      </div>
    </Card>
  );
}
