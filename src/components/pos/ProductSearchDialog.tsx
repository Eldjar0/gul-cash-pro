import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, AlertCircle, Plus, Edit, TrendingUp, Tag, FolderKanban, Barcode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProduct: (barcode?: string) => void;
  onEditProduct: (product: any) => void;
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onCreateProduct,
  onEditProduct,
}: ProductSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: products = [] } = useProducts();

  // Enable barcode scanning when dialog is open
  useBarcodeScanner({
    enabled: open,
    onScan: (barcode) => {
      setSearchTerm(barcode);
    },
    showToast: false,
  });

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.barcode?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  });

  const exactBarcodeMatch = products.find(
    (p) => p.barcode?.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rechercher un produit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Code-barres ou nom du produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {!searchTerm && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Scannez ou saisissez un code-barres</p>
                </div>
              )}

              {searchTerm && filteredProducts.length === 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Produit non trouvé</p>
                    <p className="text-xs">Code-barres: {searchTerm}</p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      onCreateProduct(searchTerm);
                      onOpenChange(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer ce produit
                  </Button>
                </div>
              )}

              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                      {product.price.toFixed(2)}€
                    </Badge>
                    <Badge variant="outline">
                      {product.type === 'weight' ? 'Au kilo' : 'À l\'unité'}
                    </Badge>
                    {product.vat_rate && (
                      <Badge variant="outline">TVA {product.vat_rate}%</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Stock actuel</p>
                      <p className="text-lg font-bold flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {product.stock ?? 0} {product.unit || 'unité'}
                      </p>
                    </div>
                    {product.min_stock !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Stock min</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {product.min_stock} {product.unit || 'unité'}
                        </p>
                      </div>
                    )}
                  </div>

                  {product.barcode && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Code-barres</p>
                      <Badge variant="secondary" className="font-mono">
                        {product.barcode}
                      </Badge>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full gap-2 h-12 text-base bg-primary mt-2"
                    onClick={() => {
                      onEditProduct(product);
                      onOpenChange(false);
                    }}
                  >
                    <Edit className="h-5 w-5" />
                    Modifier le Produit
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
