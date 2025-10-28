import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, DollarSign, Edit, Package, ExternalLink } from 'lucide-react';
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
  const navigate = useNavigate();
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
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/mobile/customer/${customerId}/special-prices`)}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Voir tout
        </Button>
      </div>

      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          {specialPrices.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Aucun prix spécial
            </div>
          ) : (
            specialPrices.slice(0, 3).map((sp) => {
              const product = sp.products;
              if (!product) return null;

              const discount = ((product.price - sp.special_price) / product.price) * 100;
              const isEditing = editingId === sp.id;

              return (
                <Card key={sp.id} className="p-3">
                  <div className="flex items-start gap-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.barcode}</p>

                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Normal</p>
                          <p className="text-sm font-medium">{product.price.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Spécial</p>
                          <p className="text-sm font-bold text-primary">
                            {sp.special_price.toFixed(2)}€
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Réduction</p>
                          <Badge variant="secondary" className="text-green-600 text-xs">
                            -{discount.toFixed(0)}%
                          </Badge>
                        </div>
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
