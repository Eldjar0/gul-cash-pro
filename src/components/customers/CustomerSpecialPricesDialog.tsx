import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Search, Check } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import {
  useCustomerSpecialPrices,
  useCreateCustomerSpecialPrice,
  useUpdateCustomerSpecialPrice,
  useDeleteCustomerSpecialPrice,
} from '@/hooks/useCustomerSpecialPrices';
import { cn } from '@/lib/utils';

interface CustomerSpecialPricesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

export function CustomerSpecialPricesDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CustomerSpecialPricesDialogProps) {
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [specialPrice, setSpecialPrice] = useState('');

  const { data: products } = useProducts();
  const { data: specialPrices } = useCustomerSpecialPrices(customerId);
  const createSpecialPrice = useCreateCustomerSpecialPrice();
  const updateSpecialPrice = useUpdateCustomerSpecialPrice();
  const deleteSpecialPrice = useDeleteCustomerSpecialPrice();

  const availableProducts = products?.filter(
    (p) => !specialPrices?.some((sp) => sp.product_id === p.id)
  );

  const handleAddSpecialPrice = () => {
    if (!selectedProductId || !specialPrice) return;

    createSpecialPrice.mutate({
      customer_id: customerId,
      product_id: selectedProductId,
      special_price: parseFloat(specialPrice),
    });

    setSelectedProductId(null);
    setSpecialPrice('');
    setProductSearchOpen(false);
  };

  const handleUpdateSpecialPrice = (id: string, newPrice: number) => {
    updateSpecialPrice.mutate({ id, special_price: newPrice });
  };

  const handleDeleteSpecialPrice = (id: string) => {
    deleteSpecialPrice.mutate(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Prix spéciaux - {customerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Special Price */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Produit</Label>
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedProductId
                      ? products?.find((p) => p.id === selectedProductId)?.name
                      : "Sélectionner un produit..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un produit..." />
                    <CommandList>
                      <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[300px]">
                          {availableProducts?.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                setSelectedProductId(product.id);
                                setProductSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Prix: {product.price.toFixed(2)}€ | {product.barcode}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-32">
              <Label>Prix spécial</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={specialPrice}
                onChange={(e) => setSpecialPrice(e.target.value)}
              />
            </div>

            <Button onClick={handleAddSpecialPrice} disabled={!selectedProductId || !specialPrice}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {/* Special Prices List */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Code-barres</TableHead>
                  <TableHead className="text-right">Prix normal</TableHead>
                  <TableHead className="text-right">Prix spécial</TableHead>
                  <TableHead className="text-right">Réduction</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialPrices?.map((sp) => {
                  const product = sp.products;
                  if (!product) return null;
                  
                  const discount = ((product.price - sp.special_price) / product.price) * 100;

                  return (
                    <TableRow key={sp.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.barcode}</TableCell>
                      <TableCell className="text-right">{product.price.toFixed(2)}€</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={sp.special_price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value);
                            if (!isNaN(newPrice) && newPrice > 0) {
                              handleUpdateSpecialPrice(sp.id, newPrice);
                            }
                          }}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        -{discount.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSpecialPrice(sp.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!specialPrices || specialPrices.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucun prix spécial configuré
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
