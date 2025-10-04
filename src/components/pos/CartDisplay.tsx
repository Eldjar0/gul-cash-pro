import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Trash2, Percent, Minus, Plus, ShoppingCart, User, Tag, CreditCard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
}

interface CartDisplayProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onApplyDiscount: (item: CartItem) => void;
  onOpenPaymentDialog: () => void;
  onOpenCheckPaymentDialog: () => void;
  onOpenMixedPaymentDialog: () => void;
  onOpenPromoCodeDialog: () => void;
  onOpenLoyaltyDialog: () => void;
  onOpenCustomerDialog: () => void;
  onOpenGiftCardDialog: () => void;
  onOpenCustomerCreditDialog: () => void;
  onClearCart: () => void;
  selectedCustomer: any;
}

const formatPrice = (price: number) => `${price.toFixed(2)}€`;

export function CartDisplay({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onOpenPaymentDialog,
  onClearCart,
  onOpenCustomerDialog,
  onOpenPromoCodeDialog,
  selectedCustomer,
}: CartDisplayProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cart.reduce((sum, item) => sum + item.discount, 0);
  const tax = subtotal * 0.2;
  const total = subtotal + tax - discount;

  return (
    <Card className="h-full flex flex-col shadow-xl border-2">
      <CardHeader className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Ticket de caisse</CardTitle>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearCart}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm text-center">
                Aucun article
                <br />
                Commencez à scanner ou sélectionner des produits
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onApplyDiscount(item)}
                        className="h-6 w-6"
                      >
                        <Percent className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-6 w-6 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="h-6 w-6"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                      {item.discount > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          -{formatPrice(item.discount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex-col gap-2 p-3 border-t bg-muted/30">
        <div className="w-full space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total:</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA (20%):</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Remise:</span>
              <span className="font-medium">-{formatPrice(discount)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-2">
          <Button
            onClick={onOpenCustomerDialog}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <User className="h-3 w-3" />
            {selectedCustomer ? selectedCustomer.name : 'Client'}
          </Button>
          <Button
            onClick={onOpenPromoCodeDialog}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Tag className="h-3 w-3" />
            Promo
          </Button>
        </div>

        <Button
          onClick={onOpenPaymentDialog}
          disabled={cart.length === 0}
          className="w-full"
          size="lg"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Payer {formatPrice(total)}
        </Button>
      </CardFooter>
    </Card>
  );
}
