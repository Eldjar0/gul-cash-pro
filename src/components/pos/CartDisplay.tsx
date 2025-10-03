import { Minus, Plus, ShoppingCart, Receipt, X, Tag } from 'lucide-react';
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
    <div className="h-full flex flex-col backdrop-blur-xl bg-card/60 rounded-2xl overflow-hidden border border-primary/20 shadow-2xl hover:shadow-3xl hover:shadow-primary/10 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b border-primary/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Ticket de caisse</h2>
          </div>
          <div className="text-right px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-xs text-muted-foreground font-medium">Articles</div>
            <div className="text-lg font-bold text-primary">{items.length}</div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <ScrollArea className="flex-1 px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fade-in">
            <div className="p-6 rounded-full bg-primary/5 border border-primary/20 mb-4">
              <ShoppingCart className="h-12 w-12 text-primary/40" />
            </div>
            <p className="text-base font-medium">Panier vide</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="backdrop-blur-sm bg-background/60 rounded-xl p-4 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.product.name}</div>
                      {item.product.barcode && (
                        <div className="text-xs text-muted-foreground mt-1">{item.product.barcode}</div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(index, Math.max(0.001, item.quantity - 1))}
                        className="bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-2 py-1 transition-all border border-primary/20 hover:border-primary/40 hover:shadow-md"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-foreground min-w-[70px] text-center font-semibold text-sm">
                        {item.quantity} {item.product.unit}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-2 py-1 transition-all border border-primary/20 hover:border-primary/40 hover:shadow-md"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApplyDiscount(index)}
                        className="bg-accent/10 hover:bg-accent/20 text-accent rounded-lg p-1.5 transition-all border border-accent/20 hover:border-accent/40 hover:shadow-md"
                      >
                        <Tag className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-1">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {item.product.price.toFixed(2)}€ × {item.quantity}
                      </div>
                      {item.discount && (
                        <div className="flex items-center gap-1.5 text-accent">
                          <Tag className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            -{item.discount.type === 'percentage' 
                              ? `${item.discount.value}%` 
                              : `${item.discount.value.toFixed(2)}€`}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">TVA: {item.vatAmount.toFixed(2)}€</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{item.total.toFixed(2)}€</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer - Totals */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-5 border-t border-primary/20 backdrop-blur-sm space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer"></div>
        <div className="space-y-2 text-sm relative z-10">
          <div className="flex justify-between text-foreground/80">
            <span className="font-medium">Sous-total HT:</span>
            <span className="font-semibold">{totals.subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-foreground/80">
            <span className="font-medium">TVA:</span>
            <span className="font-semibold">{totals.totalVat.toFixed(2)}€</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-accent animate-pulse">
              <span className="font-medium">Remise:</span>
              <span className="font-semibold">-{totals.totalDiscount.toFixed(2)}€</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-3 border-t-2 border-primary/30 relative z-10">
          <span className="text-xl font-bold text-foreground">TOTAL:</span>
          <span className="text-4xl font-black bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent drop-shadow-lg animate-pulse">
            {totals.total.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
}
