import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, DollarSign, Edit, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import {
  useCustomerSpecialPrices,
  useCreateCustomerSpecialPrice,
  useUpdateCustomerSpecialPrice,
  useDeleteCustomerSpecialPrice,
} from '@/hooks/useCustomerSpecialPrices';

interface MobileCustomerSpecialPricesProps {
  customerId: string;
}

export function MobileCustomerSpecialPrices({ customerId }: MobileCustomerSpecialPricesProps) {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newSpecialPrice, setNewSpecialPrice] = useState('');

  const { data: products = [] } = useProducts();
  const { data: specialPrices = [] } = useCustomerSpecialPrices(customerId);
  const createSpecialPrice = useCreateCustomerSpecialPrice();
  const updateSpecialPrice = useUpdateCustomerSpecialPrice();
  const deleteSpecialPrice = useDeleteCustomerSpecialPrice();

  const availableProducts = products.filter(
    (p) => !specialPrices.some((sp) => sp.product_id === p.id)
  );

  const handleAddSpecialPrice = () => {
    if (!selectedProductId || !newSpecialPrice) return;

    createSpecialPrice.mutate(
      {
        customer_id: customerId,
        product_id: selectedProductId,
        special_price: parseFloat(newSpecialPrice),
      },
      {
        onSuccess: () => {
          setSelectedProductId('');
          setNewSpecialPrice('');
          setAddSheetOpen(false);
        },
      }
    );
  };

  const handleUpdateSpecialPrice = (id: string) => {
    if (!editingPrice) return;

    const newPrice = parseFloat(editingPrice);
    if (isNaN(newPrice) || newPrice <= 0) return;

    updateSpecialPrice.mutate(
      { id, special_price: newPrice },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingPrice('');
        },
      }
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Prix spéciaux</h3>
        </div>
        {availableProducts.length > 0 && (
          <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>Ajouter un prix spécial</SheetTitle>
              </SheetHeader>

              <ScrollArea className="h-[calc(90vh-120px)] mt-4">
                <div className="space-y-4 p-4">
                  <div className="space-y-2">
                    <Label>Produit</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Prix: {product.price.toFixed(2)}€ | {product.barcode}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProductId && (
                    <div className="space-y-2">
                      <Label>Prix spécial (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newSpecialPrice}
                        onChange={(e) => setNewSpecialPrice(e.target.value)}
                      />
                      {selectedProductId && newSpecialPrice && (
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-xs text-muted-foreground mb-1">Prix normal</p>
                          <p className="text-lg font-bold mb-2">
                            {products.find(p => p.id === selectedProductId)?.price.toFixed(2)}€
                          </p>
                          {parseFloat(newSpecialPrice) > 0 && (
                            <>
                              <p className="text-xs text-muted-foreground mb-1">Réduction</p>
                              <p className="text-lg font-bold text-green-600">
                                -{(((products.find(p => p.id === selectedProductId)?.price || 0) - parseFloat(newSpecialPrice)) / (products.find(p => p.id === selectedProductId)?.price || 1) * 100).toFixed(1)}%
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <Button
                  className="w-full"
                  onClick={handleAddSpecialPrice}
                  disabled={!selectedProductId || !newSpecialPrice || createSpecialPrice.isPending}
                >
                  Ajouter le prix spécial
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {specialPrices.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Aucun prix spécial configuré
            </div>
          ) : (
            specialPrices.map((sp) => {
              const product = sp.products;
              if (!product) return null;

              const discount = ((product.price - sp.special_price) / product.price) * 100;
              const isEditing = editingId === sp.id;

              return (
                <Card key={sp.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.barcode}</p>

                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Normal</p>
                          <p className="text-sm font-medium">{product.price.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Spécial</p>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm font-bold text-primary">
                              {sp.special_price.toFixed(2)}€
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Réduction</p>
                          <Badge variant="secondary" className="text-green-600">
                            -{discount.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-1 mt-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateSpecialPrice(sp.id)}
                              disabled={updateSpecialPrice.isPending}
                              className="h-7 text-xs flex-1"
                            >
                              Enregistrer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                setEditingPrice('');
                              }}
                              className="h-7 text-xs flex-1"
                            >
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(sp.id);
                                setEditingPrice(sp.special_price.toString());
                              }}
                              className="h-7 text-xs flex-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSpecialPrice.mutate(sp.id)}
                              disabled={deleteSpecialPrice.isPending}
                              className="h-7 text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
