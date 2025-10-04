import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FolderOpen, Trash2, ShoppingCart, Smartphone } from 'lucide-react';
import { useSavedCarts, useSaveCart, useLoadCart, useDeleteSavedCart } from '@/hooks/useSavedCarts';
import { useMobileOrders, useUpdateMobileOrder, useDeleteMobileOrder } from '@/hooks/useMobileOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavedCartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCart: any[];
  onLoadCart: (cartData: any) => void;
}

export function SavedCartsDialog({
  open,
  onOpenChange,
  currentCart,
  onLoadCart,
}: SavedCartsDialogProps) {
  const [cartName, setCartName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: savedCarts = [], isLoading } = useSavedCarts();
  const { data: mobileOrders = [], isLoading: isLoadingOrders } = useMobileOrders('pending');
  const saveCart = useSaveCart();
  const loadCart = useLoadCart();
  const deleteCart = useDeleteSavedCart();
  const updateMobileOrder = useUpdateMobileOrder();
  const deleteMobileOrder = useDeleteMobileOrder();

  const handleSave = async () => {
    if (!cartName.trim()) return;
    if (currentCart.length === 0) {
      return;
    }

    setIsSaving(true);
    await saveCart.mutateAsync({
      cartName: cartName.trim(),
      cartData: currentCart,
    });
    setCartName('');
    setIsSaving(false);
  };

  const handleLoad = async (cartId: string) => {
    const result = await loadCart.mutateAsync(cartId);
    onLoadCart(result.cart_data);
    onOpenChange(false);
  };

  const handleLoadMobileOrder = async (orderId: string) => {
    const order = mobileOrders.find(o => o.id === orderId);
    if (!order) return;

    // Convert mobile order items to cart format
    const cartData = order.items.map((item: any) => ({
      product_id: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
      price: item.unit_price,
      vat_rate: 21, // Default VAT rate
      subtotal: item.total_price,
      vat_amount: item.total_price * 0.21 / 1.21,
      total: item.total_price,
    }));

    // Mark the mobile order as completed
    await updateMobileOrder.mutateAsync({ id: orderId, status: 'completed' });
    
    onLoadCart(cartData);
    onOpenChange(false);
  };

  const handleDelete = async (cartId: string) => {
    await deleteCart.mutateAsync(cartId);
  };

  const handleDeleteMobileOrder = async (orderId: string) => {
    await deleteMobileOrder.mutateAsync(orderId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Paniers Sauvegardés
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sauvegarder le panier actuel */}
          <Card className="p-4 bg-accent/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Save className="h-4 w-4" />
              Sauvegarder le panier actuel
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Nom du panier..."
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button
                onClick={handleSave}
                disabled={!cartName.trim() || currentCart.length === 0 || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
            {currentCart.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Le panier est vide
              </p>
            )}
          </Card>

          {/* Liste des paniers sauvegardés */}
          <div>
            <h3 className="font-semibold mb-3">Paniers sauvegardés ({savedCarts.length})</h3>
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : savedCarts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Aucun panier sauvegardé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedCarts.map((cart) => (
                    <Card key={cart.id} className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{cart.cart_name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {cart.cart_data.length} article{cart.cart_data.length > 1 ? 's' : ''}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(cart.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoad(cart.id)}
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Charger
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cart.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Liste des commandes mobiles */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Commandes mobiles ({mobileOrders.length})
            </h3>
            <ScrollArea className="h-[300px]">
              {isLoadingOrders ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : mobileOrders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Aucune commande mobile en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mobileOrders.map((order) => (
                    <Card key={order.id} className="p-3 hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{order.order_number}</h4>
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              Mobile
                            </Badge>
                          </div>
                          {order.customer_name && (
                            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-bold">
                              {order.total_amount.toFixed(2)}€
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleLoadMobileOrder(order.id)}
                            className="bg-primary"
                          >
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Charger
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMobileOrder(order.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Note: {order.notes}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}