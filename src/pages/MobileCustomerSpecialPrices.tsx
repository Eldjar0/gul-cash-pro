import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Package, Edit, DollarSign, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import {
  useCustomerSpecialPrices,
  useCreateCustomerSpecialPrice,
  useUpdateCustomerSpecialPrice,
  useDeleteCustomerSpecialPrice,
} from '@/hooks/useCustomerSpecialPrices';
import { useDebounce } from '@/hooks/useDebounce';

const MAX_DISPLAYED_PRODUCTS = 50;

export default function MobileCustomerSpecialPrices() {
  const { customerId } = useParams<{ customerId: string }>();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newSpecialPrice, setNewSpecialPrice] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const debouncedProductSearch = useDebounce(productSearchTerm, 300);

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: specialPrices = [] } = useCustomerSpecialPrices(customerId);
  const createSpecialPrice = useCreateCustomerSpecialPrice();
  const updateSpecialPrice = useUpdateCustomerSpecialPrice();
  const deleteSpecialPrice = useDeleteCustomerSpecialPrice();

  const customer = customers.find(c => c.id === customerId);

  const availableProducts = useMemo(() => {
    return products.filter(
      (p) => !specialPrices.some((sp) => sp.product_id === p.id)
    );
  }, [products, specialPrices]);

  // Filter and limit displayed products
  const displayedProducts = useMemo(() => {
    const searchLower = debouncedProductSearch.toLowerCase().trim();
    
    if (!searchLower) {
      return availableProducts.slice(0, MAX_DISPLAYED_PRODUCTS);
    }
    
    return availableProducts
      .filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.barcode?.toLowerCase().includes(searchLower)
      )
      .slice(0, MAX_DISPLAYED_PRODUCTS);
  }, [availableProducts, debouncedProductSearch]);

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
          setProductSearchTerm('');
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
          <Sheet open={addSheetOpen} onOpenChange={(open) => {
            setAddSheetOpen(open);
            if (!open) {
              setProductSearchTerm('');
              setSelectedProductId('');
              setNewSpecialPrice('');
            }
          }}>
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
                  {/* Info client avec TVA si pro */}
                  {customer.vat_number && (
                    <Card className="p-3 bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary text-primary">
                          Client PRO
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          TVA: {customer.vat_number}
                        </span>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label>Rechercher un produit</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom ou code-barres..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sélectionner un produit ({displayedProducts.length} affiché{displayedProducts.length > 1 ? 's' : ''})</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                      {displayedProducts.map((product) => (
                        <Card
                          key={product.id}
                          className={`p-3 cursor-pointer transition-all ${
                            selectedProductId === product.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedProductId(product.id)}
                        >
                          <div className="flex items-center gap-2">
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.price.toFixed(2)}€ | {product.barcode}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {displayedProducts.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Aucun produit trouvé
                        </p>
                      )}
                      {availableProducts.length > MAX_DISPLAYED_PRODUCTS && !debouncedProductSearch && (
                        <p className="text-xs text-center text-muted-foreground py-2">
                          {availableProducts.length - MAX_DISPLAYED_PRODUCTS} produits supplémentaires - utilisez la recherche
                        </p>
                      )}
                    </div>
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
          {/* Info client avec TVA si pro */}
          {customer.vat_number && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary text-primary font-semibold">
                    CLIENT PROFESSIONNEL
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Numéro TVA:</span>
                  <span className="text-sm font-mono font-bold">{customer.vat_number}</span>
                </div>
              </div>
            </Card>
          )}

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
                    {/* En-tête produit avec image */}
                    <div className="flex items-start gap-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
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
