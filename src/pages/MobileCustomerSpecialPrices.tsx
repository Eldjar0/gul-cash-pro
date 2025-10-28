import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Package, Edit, DollarSign } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import {
  useCustomerSpecialPrices,
  useCreateCustomerSpecialPrice,
  useUpdateCustomerSpecialPrice,
  useDeleteCustomerSpecialPrice,
} from '@/hooks/useCustomerSpecialPrices';

export default function MobileCustomerSpecialPrices() {
  const { customerId } = useParams<{ customerId: string }>();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newSpecialPrice, setNewSpecialPrice] = useState('');

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: specialPrices = [] } = useCustomerSpecialPrices(customerId);
  const createSpecialPrice = useCreateCustomerSpecialPrice();
  const updateSpecialPrice = useUpdateCustomerSpecialPrice();
  const deleteSpecialPrice = useDeleteCustomerSpecialPrice();

  const customer = customers.find(c => c.id === customerId);

  const availableProducts = products.filter(
    (p) => !specialPrices.some((sp) => sp.product_id === p.id)
  );

  const handleAddSpecialPrice = () => {
    if (!customerId || !selectedProductId || !newSpecialPrice) return;

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

  if (!customer) {
    return (
      <MobileLayout title="Prix spéciaux">
        <div className="p-8 text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Client non trouvé</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={`Prix spéciaux - ${customer.name}`}
      actions={
        availableProducts.length > 0 && (
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
        )
      }
    >
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-3 sm:p-4 space-y-3 pb-20">
          {specialPrices.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun prix spécial configuré</p>
              {availableProducts.length > 0 && (
                <Button className="mt-4" onClick={() => setAddSheetOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un prix spécial
                </Button>
              )}
            </Card>
          ) : (
            specialPrices.map((sp) => {
              const product = sp.products;
              if (!product) return null;

              const discount = ((product.price - sp.special_price) / product.price) * 100;
              const isEditing = editingId === sp.id;

              return (
                <Card key={sp.id} className="p-4">
                  <div className="space-y-3">
                    {/* En-tête produit */}
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.barcode}</p>
                      </div>
                    </div>

                    {/* Grille des prix */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">Prix normal</p>
                        <p className="text-xl font-bold">{product.price.toFixed(2)}€</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Prix spécial</p>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            className="h-9 text-lg font-bold"
                            autoFocus
                          />
                        ) : (
                          <p className="text-xl font-bold text-primary">
                            {sp.special_price.toFixed(2)}€
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badge réduction */}
                    <div className="flex items-center justify-center py-2">
                      <Badge variant="secondary" className="text-base px-4 py-2 bg-green-600 text-white">
                        Économie: -{discount.toFixed(1)}% ({(product.price - sp.special_price).toFixed(2)}€)
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {isEditing ? (
                        <>
                          <Button
                            variant="default"
                            onClick={() => handleUpdateSpecialPrice(sp.id)}
                            disabled={updateSpecialPrice.isPending}
                            className="flex-1"
                          >
                            Enregistrer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setEditingPrice('');
                            }}
                            className="flex-1"
                          >
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingId(sp.id);
                              setEditingPrice(sp.special_price.toString());
                            }}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteSpecialPrice.mutate(sp.id)}
                            disabled={deleteSpecialPrice.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
