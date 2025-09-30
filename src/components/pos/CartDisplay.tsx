import { CartItem } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Percent, Minus, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <Card className="flex flex-col h-full bg-card shadow-2xl border-2 border-primary/20 animate-fade-in">
      <div className="p-4 border-b bg-gradient-to-r from-primary to-secondary">
        <h2 className="text-xl font-bold text-white">🛒 Panier</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucun article dans le panier
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={index} className="p-3 bg-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.product.price.toFixed(2)}€
                      {item.product.type === 'weight' && '/kg'} × {item.quantity.toFixed(3)}
                      {item.product.type === 'weight' && 'kg'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdateQuantity(index, Math.max(0.001, item.quantity - (item.product.type === 'weight' ? 0.1 : 1)))}
                    className="h-7 w-7"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium min-w-12 text-center text-foreground">
                    {item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdateQuantity(index, item.quantity + (item.product.type === 'weight' ? 0.1 : 1))}
                    className="h-7 w-7"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApplyDiscount(index)}
                    className="ml-auto h-7"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    Remise
                  </Button>
                </div>

                {item.discount && (
                  <div className="text-xs bg-pos-warning/10 text-pos-warning px-2 py-1 rounded mb-2">
                    Remise: {item.discount.value}
                    {item.discount.type === 'percentage' ? '%' : '€'}
                  </div>
                )}

                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">TVA {item.product.vat}%</span>
                  <span className="font-bold text-primary">{item.total.toFixed(2)}€</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-6 border-t space-y-3 bg-gradient-to-br from-pos-display to-secondary shadow-inner">
        <div className="flex justify-between text-sm text-white/90">
          <span>Sous-total HT:</span>
          <span className="font-semibold">{totals.subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-sm text-white/90">
          <span>TVA:</span>
          <span className="font-semibold">{totals.totalVat.toFixed(2)}€</span>
        </div>
        {totals.totalDiscount > 0 && (
          <div className="flex justify-between text-sm bg-pos-warning/20 px-3 py-2 rounded-lg animate-pulse-soft">
            <span className="text-white font-semibold">🎉 Remise:</span>
            <span className="text-white font-bold">-{totals.totalDiscount.toFixed(2)}€</span>
          </div>
        )}
        <div className="flex justify-between text-2xl font-bold text-white pt-3 border-t-2 border-white/30">
          <span>TOTAL TTC:</span>
          <span className="text-pos-success">{totals.total.toFixed(2)}€</span>
        </div>
      </div>
    </Card>
  );
}
